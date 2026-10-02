import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { administrationEvents, organizations, projects } from "@/db/schema";
import { NotFoundOrForbiddenError, type Viewer } from "@/lib/auth/authorization";
import { getIdentityConfig } from "@netlify/identity";
import { InputError, id } from "@/lib/validation/operations";

export async function audit(viewer:Viewer,eventType:string,data:Record<string,unknown>){await getDb().insert(administrationEvents).values({actorId:viewer.userId,eventType,data});}
export async function validScope(organizationId:string,projectId?:string|null){
  const db=getDb();id(organizationId);
  const [org]=await db.select().from(organizations).where(and(eq(organizations.id,organizationId),eq(organizations.active,true)));
  if(!org)throw new NotFoundOrForbiddenError();
  if(projectId){id(projectId);const [project]=await db.select().from(projects).where(and(eq(projects.id,projectId),eq(projects.organizationId,organizationId),eq(projects.active,true)));if(!project)throw new NotFoundOrForbiddenError();}
}
export async function identityRequest(path:string,method:string,body?:unknown){
  const config=getIdentityConfig();
  if(!config?.token)throw new InputError("Identity administration is unavailable in this environment");
  const response=await fetch(`${config.url}${path}`,{method,headers:{Authorization:`Bearer ${config.token}`,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new InputError(response.status===422?"This email already has an Identity account":"Identity could not complete the invitation. Please retry.");
  return response.status===204?null:response.json();
}

