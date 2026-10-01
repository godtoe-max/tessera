import test from "node:test";
import assert from "node:assert/strict";
import { attachmentStorageKey, authorizeAttachmentDownload, validateAttachment } from "../lib/attachments/policy.ts";
import type { Viewer } from "../lib/auth/authorization.ts";

const scope={organizationId:"acme",projectId:"erp"};
const customer:Viewer={userId:"one",active:true,memberships:[{...scope,role:"customer_user"}]};

test("attachment upload is scoped, typed, and size limited",()=>{
  assert.deepEqual(validateAttachment(customer,scope,{name:"close report.pdf",type:"application/pdf",size:4000}),{ok:true});
  assert.equal(validateAttachment(customer,scope,{name:"script.exe",type:"application/x-msdownload",size:4000}).ok,false);
  assert.equal(validateAttachment(customer,scope,{name:"large.pdf",type:"application/pdf",size:21*1024*1024}).ok,false);
});

test("attachment download uses the parent Tessera authorization",()=>{
  assert.doesNotThrow(()=>authorizeAttachmentDownload(customer,scope));
  assert.throws(()=>authorizeAttachmentDownload(customer,{organizationId:"northstar",projectId:"controls"}),/not found/i);
});

test("attachment keys preserve tenant and Tessera boundaries",()=>{
  assert.equal(attachmentStorageKey(scope,"t-1","a-1","Close Report (Final).pdf"),"organizations/acme/tesserae/t-1/a-1/Close-Report-Final-.pdf");
});
