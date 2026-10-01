import test from "node:test";
import assert from "node:assert/strict";
import { toCustomerTessera } from "../lib/data/customer-projection.ts";

test("customer responses omit internal notes and consultant-only fields",()=>{
  const result=toCustomerTessera({
    id:"t-1",number:"1048",organizationId:"acme",projectId:"erp",title:"Mapping",description:"Please update it",
    status:"in_progress",mark:"urgent",assigneeName:"Sofia Garcia",messages:[
      {id:"m-1",authorName:"Maya",body:"Customer reply",visibility:"customer",createdAt:"now"},
      {id:"m-2",authorName:"Sofia",body:"Internal note",visibility:"internal",createdAt:"now"},
    ],
  });
  assert.equal(result.messages.length,1);
  assert.equal(result.messages[0].body,"Customer reply");
  assert.equal("mark" in result,false);
  assert.equal("assigneeName" in result,false);
  assert.equal("organizationId" in result,false);
  assert.equal("visibility" in result.messages[0],false);
});
