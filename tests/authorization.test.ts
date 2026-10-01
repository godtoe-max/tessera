import test from "node:test";
import assert from "node:assert/strict";
import { canRead, canSeeInternalMessages, canWrite, requireRead, type Viewer } from "../lib/auth/authorization.ts";

const resource={organizationId:"acme",projectId:"erp"};
const viewer=(role:Viewer["memberships"][number]["role"],organizationId="acme",projectId?:string):Viewer=>({userId:"user-1",active:true,memberships:[{role,organizationId,projectId}]});

test("customer can read and reply inside the assigned project",()=>{
  const customer=viewer("customer_user","acme","erp");
  assert.equal(canRead(customer,resource),true);
  assert.equal(canWrite(customer,resource),true);
  assert.equal(canSeeInternalMessages(customer,resource),false);
});

test("customer cannot see another customer or project",()=>{
  assert.equal(canRead(viewer("customer_manager","northstar"),resource),false);
  assert.equal(canRead(viewer("customer_user","acme","analytics"),resource),false);
  assert.throws(()=>requireRead(viewer("customer_user","northstar"),resource),/not found/i);
});

test("consultant can see internal notes only in assigned scope",()=>{
  assert.equal(canSeeInternalMessages(viewer("consultant","acme","erp"),resource),true);
  assert.equal(canSeeInternalMessages(viewer("consultant","northstar"),resource),false);
});

test("operations and administrators have cross-client scope",()=>{
  assert.equal(canRead(viewer("operations_manager","operations"),resource),true);
  assert.equal(canWrite(viewer("administrator","operations"),resource),true);
});

test("auditors and disabled accounts cannot modify records",()=>{
  assert.equal(canWrite(viewer("auditor","acme"),resource),false);
  const disabled=viewer("administrator","operations"); disabled.active=false;
  assert.equal(canRead(disabled,resource),false);
});
