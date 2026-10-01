export type TesseraEventType="tessera.created"|"tessera.status_changed"|"tessera.assigned"|"tessera.mark_changed"|"message.customer_added"|"message.internal_added"|"attachment.added"|"attachment.removed"|"membership.created"|"membership.changed"|"membership.revoked";
export type AuditEvent={type:TesseraEventType;actorId:string|null;tesseraId?:string;organizationId:string;projectId?:string;occurredAt:Date;data:Record<string,string|number|boolean|null>};

export interface AuditSink { record(event:AuditEvent):Promise<void> }

export function statusChangeEvent(input:{actorId:string;tesseraId:string;organizationId:string;projectId:string;from:string;to:string}):AuditEvent{
 return {type:"tessera.status_changed",actorId:input.actorId,tesseraId:input.tesseraId,organizationId:input.organizationId,projectId:input.projectId,occurredAt:new Date(),data:{from:input.from,to:input.to}};
}
