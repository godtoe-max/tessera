import test from "node:test";
import assert from "node:assert/strict";
import { canInvite, type Viewer } from "../lib/auth/authorization.ts";

const viewer=(role:Viewer["memberships"][number]["role"],organizationId="acme",projectId?:string):Viewer=>({userId:"u",active:true,memberships:[{role,organizationId,projectId}]});

test("administrators and operations managers can invite across organizations",()=>{
 assert.equal(canInvite(viewer("administrator","internal"),{organizationId:"acme",role:"engagement_lead"}),true);
 assert.equal(canInvite(viewer("operations_manager","internal"),{organizationId:"northstar",role:"customer_manager"}),true);
});
test("engagement leads are limited to their engagement",()=>{
 assert.equal(canInvite(viewer("engagement_lead","acme"),{organizationId:"acme",role:"consultant"}),true);
 assert.equal(canInvite(viewer("engagement_lead","acme"),{organizationId:"northstar",role:"consultant"}),false);
 assert.equal(canInvite(viewer("engagement_lead","acme"),{organizationId:"acme",role:"administrator"}),false);
});
test("customer managers can only invite customer users in their organization",()=>{
 assert.equal(canInvite(viewer("customer_manager","acme"),{organizationId:"acme",role:"customer_user"}),true);
 assert.equal(canInvite(viewer("customer_manager","acme"),{organizationId:"acme",role:"consultant"}),false);
});
