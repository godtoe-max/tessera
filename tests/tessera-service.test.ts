import test from "node:test";
import assert from "node:assert/strict";
import { TesseraService } from "../lib/services/tessera-service.ts";
import type { Viewer } from "../lib/auth/authorization.ts";
import type { NewTessera, TesseraRepository, TesseraSummary } from "../lib/data/tessera-repository.ts";

const record:TesseraSummary={id:"t-1",number:"1048",organizationId:"acme",projectId:"erp",title:"Mapping",status:"open",updatedAt:new Date(0)};
function repository(){
  const messages:Array<{body:string;visibility:string}>=[];
  const repo:TesseraRepository={
    async listForViewer(){return [record]}, async findForViewer(_viewer,id){return id===record.id?record:null},
    async createForViewer(_viewer,input:NewTessera){return {...record,...input}},
    async addMessage(_viewer,_id,body,visibility){messages.push({body,visibility})},
  };
  return {repo,messages};
}
const customer:Viewer={userId:"customer",active:true,memberships:[{organizationId:"acme",projectId:"erp",role:"customer_user"}]};
const consultant:Viewer={userId:"consultant",active:true,memberships:[{organizationId:"acme",projectId:"erp",role:"consultant"}]};

test("service rejects an internal note from a customer",async()=>{
  const {repo,messages}=repository();
  assert.equal(await new TesseraService(repo).addMessage(customer,"t-1","private","internal"),false);
  assert.equal(messages.length,0);
});

test("service accepts a trimmed internal note from an assigned consultant",async()=>{
  const {repo,messages}=repository();
  assert.equal(await new TesseraService(repo).addMessage(consultant,"t-1","  needs review  ","internal"),true);
  assert.deepEqual(messages,[{body:"needs review",visibility:"internal"}]);
});

test("service returns null without leaking an unknown Tessera",async()=>{
  const {repo}=repository();
  assert.equal(await new TesseraService(repo).get(customer,"missing"),null);
});
