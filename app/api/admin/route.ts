import { and, desc, eq, sql } from "drizzle-orm";
import { verifyRequestOrigin } from "@netlify/identity";
import { getDb } from "@/db";
import { administrationEvents, organizations, projects, workspaceSettings, users, organizationMemberships, projectMemberships } from "@/db/schema";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { canGrantRole, requireAdministrator, NotFoundOrForbiddenError } from "@/lib/auth/authorization";
import { apiError } from "@/lib/api/responses";
import { audit, validScope } from "@/lib/server/administration";
import { InputError, id, invitationInput, text } from "@/lib/validation/operations";

export const dynamic="force-dynamic";
export async function GET(){try{
  const viewer=await requireCurrentViewer();requireAdministrator(viewer);const db=getDb();
  return Response.json({organizations:await db.select().from(organizations),projects:await db.select().from(projects),users:await db.select({id:users.id,displayName:users.displayName,email:users.email,accountType:users.accountType,active:users.active}).from(users),organizationMemberships:await db.select().from(organizationMemberships),projectMemberships:await db.select().from(projectMemberships),settings:(await db.select().from(workspaceSettings).where(eq(workspaceSettings.id,"workspace")))[0]??{name:"Tessera",defaultMark:"normal"},events:await db.select({id:administrationEvents.id,eventType:administrationEvents.eventType,data:administrationEvents.data,createdAt:administrationEvents.createdAt,actorName:users.displayName}).from(administrationEvents).leftJoin(users,eq(users.id,administrationEvents.actorId)).orderBy(desc(administrationEvents.createdAt)).limit(100)});
}catch(error){return apiError(error);}}
export async function POST(request:Request){try{
  verifyRequestOrigin(request);const viewer=await requireCurrentViewer();requireAdministrator(viewer);const input=await request.json(),db=getDb();
  if(input.action==="organization"){
    const name=text(input.name,2,120),slug=`${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"organization"}-${crypto.randomUUID().slice(0,8)}`;
    const [organization]=await db.insert(organizations).values({name,slug}).returning();await audit(viewer,"organization.created",{organizationId:organization.id,name});return Response.json({organization},{status:201});
  }
  if(input.action==="project"){
    const organizationId=id(input.organizationId);await validScope(organizationId);const name=text(input.name,2,120);
    const [project]=await db.insert(projects).values({organizationId,name,slug:`project-${crypto.randomUUID()}`}).returning();await audit(viewer,"project.created",{projectId:project.id,organizationId,name});return Response.json({project},{status:201});
  }
  throw new InputError("Choose a supported administration action");
}catch(error){return apiError(error);}}
export async function PATCH(request:Request){try{
  verifyRequestOrigin(request);const initialViewer=await requireCurrentViewer();requireAdministrator(initialViewer);const input=await request.json();
  return await getDb().transaction(async db=>{
  await db.execute(sql`SELECT pg_advisory_xact_lock(74192155)`);
  const [actor]=await db.select().from(users).where(eq(users.id,initialViewer.userId));
  const memberships=await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId,initialViewer.userId));
  const viewer={...initialViewer,active:actor?.active??false,memberships};requireAdministrator(viewer);
  const audit=async(_viewer:typeof viewer,eventType:string,data:Record<string,unknown>)=>{
    const admins=await db.select({id:users.id}).from(users).innerJoin(organizationMemberships,eq(users.id,organizationMemberships.userId)).where(and(eq(users.active,true),eq(organizationMemberships.role,"administrator")));
    if(!admins.length)throw new InputError("Keep at least one active administrator");
    await db.insert(administrationEvents).values({actorId:viewer.userId,eventType,data});
  };
  if(input.action==="organization"||input.action==="project"){
    const recordId=id(input.id),name=input.name===undefined?undefined:text(input.name,2,120);
    if(input.active!==undefined&&typeof input.active!=="boolean")throw new InputError("Choose an active status");
    if(name===undefined&&input.active===undefined)throw new InputError("Choose a change to save");
    const table=input.action==="organization"?organizations:projects;
    const [record]=await db.update(table).set({name,active:input.active}).where(eq(table.id,recordId)).returning({id:table.id});
    if(!record)throw new NotFoundOrForbiddenError();await audit(viewer,`${input.action}.changed`,{id:recordId,name,active:input.active});return Response.json({ok:true});
  }
  if(input.action==="settings"){
    const name=text(input.name,2,120),defaultMark=input.defaultMark;
    if(!["urgent","high","normal","low"].includes(defaultMark))throw new InputError("Choose a valid default Mark");
    await db.insert(workspaceSettings).values({id:"workspace",name,defaultMark}).onConflictDoUpdate({target:workspaceSettings.id,set:{name,defaultMark,updatedAt:new Date()}});await audit(viewer,"settings.changed",{name,defaultMark});return Response.json({ok:true});
  }
  if(input.action==="account"){
    const userId=id(input.userId);if(userId===viewer.userId)throw new InputError("You cannot disable your own account");
    await protectAdministrator(viewer,userId);
    if(typeof input.active!=="boolean")throw new InputError("Choose an account status");
    const [user]=await db.update(users).set({active:input.active,updatedAt:new Date()}).where(eq(users.id,userId)).returning({id:users.id});if(!user)throw new NotFoundOrForbiddenError();
    await audit(viewer,input.active?"account.enabled":"account.disabled",{userId});return Response.json({ok:true});
  }
  if(input.action==="membership"){
    const userId=id(input.userId);if(userId===viewer.userId)throw new InputError("Change your own access through another administrator");
    await protectAdministrator(viewer,userId);
    const [user]=await db.select().from(users).where(eq(users.id,userId));if(!user)throw new NotFoundOrForbiddenError();
    const parsed=invitationInput({...input,email:user.email,accountType:user.accountType});await validScope(parsed.organizationId,parsed.projectId);
    if(!canGrantRole(viewer,parsed.role))throw new NotFoundOrForbiddenError();
    if(parsed.projectId)await db.insert(projectMemberships).values({userId,projectId:parsed.projectId,role:parsed.role}).onConflictDoUpdate({target:[projectMemberships.projectId,projectMemberships.userId],set:{role:parsed.role}});
    else await db.insert(organizationMemberships).values({userId,organizationId:parsed.organizationId,role:parsed.role}).onConflictDoUpdate({target:[organizationMemberships.userId,organizationMemberships.organizationId],set:{role:parsed.role}});
    await audit(viewer,"membership.changed",{userId,...parsed});return Response.json({ok:true});
  }
  if(input.action==="revokeMembership"){
    const userId=id(input.userId);if(userId===viewer.userId)throw new InputError("You cannot revoke your own access");
    await protectAdministrator(viewer,userId);
    if(input.projectId)await db.delete(projectMemberships).where(and(eq(projectMemberships.userId,userId),eq(projectMemberships.projectId,id(input.projectId))));
    else await db.delete(organizationMemberships).where(and(eq(organizationMemberships.userId,userId),eq(organizationMemberships.organizationId,id(input.organizationId))));
    await audit(viewer,"membership.revoked",{userId,organizationId:input.organizationId,projectId:input.projectId});return Response.json({ok:true});
  }
  throw new InputError("Choose a supported administration action");
  });
}catch(error){return apiError(error);}}

async function protectAdministrator(viewer:Parameters<typeof canGrantRole>[0],userId:string){
  const memberships=await getDb().select().from(organizationMemberships).where(and(eq(organizationMemberships.userId,userId),eq(organizationMemberships.role,"administrator")));
  if(memberships.length&&!canGrantRole(viewer,"administrator"))throw new NotFoundOrForbiddenError();
}

