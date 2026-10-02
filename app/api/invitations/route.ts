import { and, desc, eq, gt } from "drizzle-orm";
import { verifyRequestOrigin } from "@netlify/identity";
import { getDb } from "@/db";
import { invitations, users } from "@/db/schema";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { canGrantRole, requireAdministrator, NotFoundOrForbiddenError } from "@/lib/auth/authorization";
import { apiError } from "@/lib/api/responses";
import { audit, validScope, identityRequest } from "@/lib/server/administration";
import { InputError, id, invitationInput } from "@/lib/validation/operations";
export const dynamic="force-dynamic";
export async function GET(){try{const viewer=await requireCurrentViewer();requireAdministrator(viewer);return Response.json({invitations:await getDb().select().from(invitations).orderBy(desc(invitations.createdAt))});}catch(error){return apiError(error);}}
export async function POST(request:Request){try{
  verifyRequestOrigin(request);const viewer=await requireCurrentViewer();requireAdministrator(viewer);const input=invitationInput(await request.json());if(!canGrantRole(viewer,input.role))throw new NotFoundOrForbiddenError();await validScope(input.organizationId,input.projectId);const db=getDb();
  if((await db.select({id:users.id}).from(users).where(eq(users.email,input.email))).length)throw new InputError("This person already has an account. Update their memberships instead.");
  if((await db.select({id:invitations.id}).from(invitations).where(and(eq(invitations.email,input.email),eq(invitations.status,"pending"),gt(invitations.expiresAt,new Date())))).length)throw new InputError("A pending invitation already exists for this email");
  const [invite]=await db.insert(invitations).values({...input,invitedById:viewer.userId,expiresAt:new Date(Date.now()+7*86400000)}).returning();
  try{
    const identity=await identityRequest("/invite","POST",{email:input.email,data:{full_name:input.email.split("@")[0]}});
    await db.update(invitations).set({identityInviteId:identity.id}).where(eq(invitations.id,invite.id));
  }catch(error){await db.update(invitations).set({status:"revoked"}).where(eq(invitations.id,invite.id));throw error;}
  await audit(viewer,"invitation.sent",{invitationId:invite.id,...input});return Response.json({ok:true},{status:201});
}catch(error){return apiError(error);}}
export async function PATCH(request:Request){try{
  verifyRequestOrigin(request);const viewer=await requireCurrentViewer();requireAdministrator(viewer);const input=await request.json(),inviteId=id(input.id);
  const [invite]=await getDb().update(invitations).set({status:"revoked"}).where(and(eq(invitations.id,inviteId),eq(invitations.status,"pending"))).returning();
  if(!invite)throw new InputError("This invitation is no longer pending");
  await audit(viewer,"invitation.revoked",{invitationId:inviteId});return Response.json({ok:true});
}catch(error){return apiError(error);}}

