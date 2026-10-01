export type TesseraRole =
  | "customer_user" | "customer_manager" | "consultant"
  | "engagement_lead" | "operations_manager" | "administrator" | "auditor";

export type Membership = { organizationId:string; projectId?:string; role:TesseraRole };
export type Viewer = { userId:string; active:boolean; memberships:Membership[] };
export type ResourceScope = { organizationId:string; projectId:string };

const crossClientRoles = new Set<TesseraRole>(["operations_manager", "administrator"]);
const writeRoles = new Set<TesseraRole>(["customer_user", "customer_manager", "consultant", "engagement_lead", "operations_manager", "administrator"]);

export function canRead(viewer:Viewer, resource:ResourceScope){
  if(!viewer.active) return false;
  if(viewer.memberships.some(m=>crossClientRoles.has(m.role))) return true;
  return viewer.memberships.some(m=>m.organizationId===resource.organizationId&&(!m.projectId||m.projectId===resource.projectId));
}

export function canWrite(viewer:Viewer, resource:ResourceScope){
  return canRead(viewer,resource)&&viewer.memberships.some(m=>writeRoles.has(m.role)&&(crossClientRoles.has(m.role)||m.organizationId===resource.organizationId)&&(!m.projectId||m.projectId===resource.projectId));
}

export function canSeeInternalMessages(viewer:Viewer, resource:ResourceScope){
  return canRead(viewer,resource)&&viewer.memberships.some(m=>!["customer_user","customer_manager"].includes(m.role));
}

export function authorizedOrganizationIds(viewer:Viewer){
  if(!viewer.active) return [];
  if(viewer.memberships.some(m=>crossClientRoles.has(m.role))) return "all" as const;
  return [...new Set(viewer.memberships.map(m=>m.organizationId))];
}
