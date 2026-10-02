import type { TesseraRole } from "../auth/authorization.ts";
export class InputError extends Error {readonly status=400;}
export const uuid=(value:unknown)=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function id(value:unknown){if(!uuid(value))throw new InputError("Choose a valid record");return value as string;}
export function text(value:unknown,min=1,max=160){if(typeof value!=="string"||value.trim().length<min||value.trim().length>max)throw new InputError(`Use ${min}–${max} characters`);return value.trim();}
export function ticketPatch(input:Record<string,unknown>){
  const allowed=["status","mark","assigneeId","dueAt"];
  if(!Object.keys(input).length||Object.keys(input).some(key=>!allowed.includes(key)))throw new InputError("Choose a supported request update");
  const output:{status?:"open"|"in_progress"|"waiting"|"redeemed";mark?:"urgent"|"high"|"normal"|"low";assigneeId?:string|null;dueAt?:Date|null}={};
  if("status" in input){if(!["open","in_progress","waiting","redeemed"].includes(String(input.status)))throw new InputError("Choose a valid status");output.status=input.status as typeof output.status;}
  if("mark" in input){if(!["urgent","high","normal","low"].includes(String(input.mark)))throw new InputError("Choose a valid Mark");output.mark=input.mark as typeof output.mark;}
  if("assigneeId" in input)output.assigneeId=input.assigneeId===null?null:id(input.assigneeId);
  if("dueAt" in input){if(input.dueAt===null)output.dueAt=null;else {if(typeof input.dueAt!=="string"||!Number.isFinite(Date.parse(input.dueAt)))throw new InputError("Choose a valid due date");output.dueAt=new Date(input.dueAt);}}
  return output;
}
const customerRoles=["customer_user","customer_manager"];
const consultantRoles=["consultant","engagement_lead","operations_manager","administrator","auditor"];
export function invitationInput(input:Record<string,unknown>){
  const email=text(input.email,3,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new InputError("Enter a valid email address");
  const accountType=input.accountType;
  if(accountType!=="customer"&&accountType!=="consultant")throw new InputError("Choose an account type");
  if(!(accountType==="customer"?customerRoles:consultantRoles).includes(String(input.role)))throw new InputError("Choose a role for this account type");
  const role=input.role as TesseraRole,organizationId=id(input.organizationId),projectId=input.projectId?id(input.projectId):null;
  if(projectId&&["administrator","operations_manager"].includes(role))throw new InputError("Workspace roles cannot be restricted to a project");
  return {email,accountType:accountType as "customer"|"consultant",role,organizationId,projectId};
}

