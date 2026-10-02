import test from "node:test";
import assert from "node:assert/strict";
import { projectsForViewer } from "../lib/data/catalog-policy.ts";
import type { Viewer } from "../lib/auth/authorization.ts";

const projects=[{id:"erp",organizationId:"acme",name:"ERP"},{id:"finance",organizationId:"acme",name:"Finance"},{id:"controls",organizationId:"northstar",name:"Controls"}];
test("project-only customers receive only their project in the creation catalog",()=>{
  const viewer:Viewer={userId:"customer",active:true,memberships:[{organizationId:"acme",projectId:"erp",role:"customer_user"}]};
  assert.deepEqual(projectsForViewer(viewer,projects),[{...projects[0],canCreate:true}]);
});
test("organization memberships include all projects in that organization",()=>{
  const viewer:Viewer={userId:"lead",active:true,memberships:[{organizationId:"acme",role:"engagement_lead"}]};
  assert.deepEqual(projectsForViewer(viewer,projects).map(project=>project.id),["erp","finance"]);
});
test("auditors can browse their catalog but cannot create requests",()=>{
  const viewer:Viewer={userId:"audit",active:true,memberships:[{organizationId:"acme",role:"auditor"}]};
  assert.equal(projectsForViewer(viewer,projects).length,2);
  assert.ok(projectsForViewer(viewer,projects).every(project=>!project.canCreate));
});
test("administrators have cross-client catalogs and inactive viewers have none",()=>{
  const viewer:Viewer={userId:"admin",active:true,memberships:[{organizationId:"consulting",role:"administrator"}]};
  assert.equal(projectsForViewer(viewer,projects).length,3);
  assert.deepEqual(projectsForViewer({...viewer,active:false},projects),[]);
});
