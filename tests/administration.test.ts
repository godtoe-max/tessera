import test from "node:test";
import assert from "node:assert/strict";
import { canAdminister, canGrantRole, canSeeInternalMessages, requireAdministrator, type Viewer } from "../lib/auth/authorization.ts";
import { invitationInput, ticketPatch, text } from "../lib/validation/operations.ts";
const organizationId="8ebeb336-df30-4a0f-b98b-ec2239ebc458",projectId="0e31f02f-fdbf-435b-8ebd-a5bdd289a0a8";
const viewer=(role:Viewer["memberships"][number]["role"],active=true):Viewer=>({userId:"viewer",active,memberships:[{organizationId,role}]});
test("administration excludes customers, consultants, auditors, and disabled admins",()=>{
  for(const role of ["customer_user","customer_manager","consultant","auditor"] as const){assert.equal(canAdminister(viewer(role)),false);assert.throws(()=>requireAdministrator(viewer(role)));}
  assert.equal(canAdminister(viewer("administrator",false)),false);
  assert.equal(canAdminister(viewer("administrator")),true);
});
test("only an administrator can appoint another administrator",()=>{
  assert.equal(canGrantRole(viewer("administrator"),"administrator"),true);
  assert.equal(canGrantRole(viewer("operations_manager"),"administrator"),false);
  assert.equal(canGrantRole(viewer("operations_manager"),"consultant"),true);
});
test("customer accounts cannot receive consultant or administrator roles",()=>{
  assert.throws(()=>invitationInput({email:"test@example.com",accountType:"customer",role:"administrator",organizationId}));
  assert.throws(()=>invitationInput({email:"test@example.com",accountType:"consultant",role:"customer_manager",organizationId}));
});
test("administrator invitations are organization-wide and email is normalized",()=>{
  const input=invitationInput({email:" TEST@example.com ",accountType:"consultant",role:"administrator",organizationId});
  assert.equal(input.email,"test@example.com");assert.equal(input.role,"administrator");assert.equal(input.projectId,null);
  assert.throws(()=>invitationInput({...input,projectId}));
});
test("invalid identifiers, dates, and unsupported updates are rejected",()=>{
  assert.throws(()=>invitationInput({email:"test@example.com",accountType:"customer",role:"customer_user",organizationId:"acme"}));
  assert.throws(()=>ticketPatch({dueAt:"not a date"}));assert.throws(()=>ticketPatch({organizationId}));assert.throws(()=>text(" ",2,120));
});
test("a consultant role in another organization cannot reveal internal notes",()=>{
  const mixed:Viewer={userId:"mixed",active:true,memberships:[{organizationId:"other",role:"consultant"},{organizationId,projectId,role:"customer_user"}]};
  assert.equal(canSeeInternalMessages(mixed,{organizationId,projectId}),false);
});

