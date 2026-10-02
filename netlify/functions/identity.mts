import type { UserLoginEvent, UserSignupEvent } from "@netlify/functions";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "../../db/index.ts";
import { administrationEvents, invitations, organizationMemberships, organizations, projectMemberships, users } from "../../db/schema.ts";
import type { TesseraRole } from "../../lib/auth/authorization.ts";

const consultantRoles=new Set(["consultant","engagement_lead","operations_manager","administrator","auditor"]);
async function provision(event:UserSignupEvent|UserLoginEvent){
  const identity=event.user;if(!identity.email)return event.deny();
  const db=getDb(),email=identity.email.toLowerCase();
  const [existing]=await db.select().from(users).where(eq(users.identityId,identity.id));
  if(existing){if(!existing.active)return event.deny();return;}
  const accepted=await db.transaction(async tx=>{
    const [invite]=await tx.select().from(invitations).where(and(eq(invitations.email,email),eq(invitations.status,"pending"),gt(invitations.expiresAt,new Date()))).orderBy(desc(invitations.createdAt)).limit(1).for("update");
    const bootstrapRole=identity.roles?.find(value=>consultantRoles.has(value)) as TesseraRole|undefined;
    if(!invite&&!bootstrapRole)return false;
    if(invite?.identityInviteId&&invite.identityInviteId!==identity.id)return false;
    const [appUser]=await tx.insert(users).values({identityId:identity.id,email,displayName:identity.name?.trim()||email.split("@")[0],accountType:invite?.accountType??"consultant"}).onConflictDoNothing({target:users.identityId}).returning();
    if(!appUser)return true;
    if(invite){
      if(!invite.organizationId)throw new Error("Invitation has no organization");
      if(invite.projectId)await tx.insert(projectMemberships).values({userId:appUser.id,projectId:invite.projectId,role:invite.role});
      else await tx.insert(organizationMemberships).values({userId:appUser.id,organizationId:invite.organizationId,role:invite.role});
      await tx.update(invitations).set({status:"accepted",acceptedAt:new Date()}).where(eq(invitations.id,invite.id));
      await tx.insert(administrationEvents).values({actorId:appUser.id,eventType:"invitation.accepted",data:{invitationId:invite.id}});
    }else{
      const [org]=await tx.insert(organizations).values({name:"Etymon Consulting",slug:"etymon-consulting"}).onConflictDoUpdate({target:organizations.slug,set:{slug:"etymon-consulting"}}).returning();
      await tx.insert(organizationMemberships).values({userId:appUser.id,organizationId:org.id,role:bootstrapRole!});
    }
    return true;
  });
  if(!accepted)return event.deny();
}
const handlers={userSignup:provision,userLogin:provision};
export default handlers;

