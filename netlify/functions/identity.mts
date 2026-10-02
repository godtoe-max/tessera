import type { UserLoginEvent, UserSignupEvent } from "@netlify/functions";
import { getDb } from "../../db/index.ts";
import { organizationMemberships, organizations, users } from "../../db/schema.ts";

const consultantRoles=new Set(["consultant","engagement_lead","operations_manager","administrator","auditor"]);
type ConsultantRole="consultant"|"engagement_lead"|"operations_manager"|"administrator"|"auditor";

async function provision(event:UserSignupEvent|UserLoginEvent){
  const identity=event.user;
  if(!identity.email) return event.deny();
  const role=identity.roles?.find(value=>consultantRoles.has(value)) as ConsultantRole|undefined;
  if(!role) return;
  const db=getDb();

  await db.transaction(async tx=>{
    const [appUser]=await tx.insert(users).values({
      identityId:identity.id,
      email:identity.email!.toLowerCase(),
      displayName:identity.name?.trim()||identity.email!.split("@")[0],
      accountType:"consultant",
    }).onConflictDoUpdate({
      target:users.identityId,
      set:{email:identity.email!.toLowerCase(),displayName:identity.name?.trim()||identity.email!.split("@")[0],active:true,updatedAt:new Date()},
    }).returning({id:users.id});

    const [consultingOrg]=await tx.insert(organizations).values({name:"Etymon Consulting",slug:"etymon-consulting"})
      .onConflictDoUpdate({target:organizations.slug,set:{name:"Etymon Consulting",active:true}})
      .returning({id:organizations.id});

    await tx.insert(organizationMemberships).values({userId:appUser.id,organizationId:consultingOrg.id,role})
      .onConflictDoUpdate({
        target:[organizationMemberships.userId,organizationMemberships.organizationId],
        set:{role},
      });
  });
}

export default {
  userSignup:provision,
  userLogin:provision,
};
