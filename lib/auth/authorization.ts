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
  return canRead(viewer,resource)&&viewer.memberships.some(m=>!["customer_user","customer_manager"].includes(m.role)&&(crossClientRoles.has(m.role)||m.organizationId===resource.organizationId&&(!m.projectId||m.projectId===resource.projectId)));
}

export function canAdminister(viewer:Viewer){return viewer.active&&viewer.memberships.some(m=>crossClientRoles.has(m.role));}
export function canManageTessera(viewer:Viewer,resource:ResourceScope){
  return canWrite(viewer,resource)&&canSeeInternalMessages(viewer,resource);
}
export function requireAdministrator(viewer:Viewer){if(!canAdminister(viewer))throw new NotFoundOrForbiddenError();}
export function canGrantRole(viewer:Viewer,role:TesseraRole){return canAdminister(viewer)&&(role!=="administrator"||viewer.memberships.some(m=>m.role==="administrator"));}

export function authorizedOrganizationIds(viewer:Viewer){
  if(!viewer.active) return [];
  if(viewer.memberships.some(m=>crossClientRoles.has(m.role))) return "all" as const;
  return [...new Set(viewer.memberships.map(m=>m.organizationId))];
}

export class NotFoundOrForbiddenError extends Error {
  readonly status = 404;
  constructor(){ super("Resource not found"); }
}

export function requireRead(viewer:Viewer, resource:ResourceScope){
  if(!canRead(viewer,resource)) throw new NotFoundOrForbiddenError();
}

export function requireWrite(viewer:Viewer, resource:ResourceScope){
  if(!canWrite(viewer,resource)) throw new NotFoundOrForbiddenError();
}

export function canInvite(viewer:Viewer,request:{organizationId:string;projectId?:string;role:TesseraRole}){
  if(!viewer.active) return false;
  if(viewer.memberships.some(m=>m.role==="administrator"||m.role==="operations_manager")) return true;
  return viewer.memberships.some(m=>{
    if(m.organizationId!==request.organizationId) return false;
    if(m.projectId&&m.projectId!==request.projectId) return false;
    if(m.role==="engagement_lead") return ["customer_user","customer_manager","consultant"].includes(request.role);
    if(m.role==="customer_manager") return request.role==="customer_user";
    return false;
  });
}

