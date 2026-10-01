import test from "node:test";
import assert from "node:assert/strict";
import { validateMessage, validateTesseraInput } from "../lib/validation/tessera.ts";

test("Tessera input is trimmed and normalized",()=>{
 const result=validateTesseraInput({title:"  Mapping issue  ",description:"  The values do not reconcile.  ",organizationId:"acme",projectId:"erp",mark:"HIGH"});
 assert.equal(result.valid,true);
 if(result.valid){assert.equal(result.value.title,"Mapping issue");assert.equal(result.value.mark,"high")}
});
test("Tessera input returns field-specific errors",()=>{
 const result=validateTesseraInput({title:"No",description:"short",organizationId:"",projectId:"",mark:"emergency"});
 assert.equal(result.valid,false);
 if(!result.valid) assert.deepEqual(Object.keys(result.errors).sort(),["description","mark","organizationId","projectId","title"]);
});
test("message validation rejects blank and oversized replies",()=>{
 assert.equal(validateMessage("   ").valid,false);
 assert.equal(validateMessage("x".repeat(20001)).valid,false);
 assert.deepEqual(validateMessage("  Thanks  "),{valid:true,value:"Thanks"});
});
