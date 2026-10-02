import "server-only";

import { getUser } from "@netlify/identity";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizationMemberships, projectMemberships, projects, users } from "@/db/schema";
import type { Viewer } from "./authorization";

export type CurrentViewer = Viewer & {
  email:string;
  displayName:string;
  accountType:"consultant"|"customer";
};

export async function getCurrentViewer():Promise<CurrentViewer|null>{
  const identity=await getUser();
  if(!identity?.email) return null;
  const db=getDb();
  const [appUser]=await db.select().from(users).where(eq(users.identityId,identity.id)).limit(1);
  if(!appUser||!appUser.active) return null;

  const orgMemberships=await db.select({organizationId:organizationMemberships.organizationId,role:organizationMemberships.role})
    .from(organizationMemberships).where(eq(organizationMemberships.userId,appUser.id));
  const projectRows=await db.select({organizationId:projects.organizationId,projectId:projectMemberships.projectId,role:projectMemberships.role})
    .from(projectMemberships).innerJoin(projects,eq(projectMemberships.projectId,projects.id))
    .where(eq(projectMemberships.userId,appUser.id));

  return {
    userId:appUser.id, active:true, email:appUser.email, displayName:appUser.displayName,
    accountType:appUser.accountType,
    memberships:[...orgMemberships,...projectRows],
  };
}

export class AuthenticationError extends Error { readonly status=401; constructor(){super("Authentication required");} }

export async function requireCurrentViewer(){
  const viewer=await getCurrentViewer();
  if(!viewer) throw new AuthenticationError();
  return viewer;
}
