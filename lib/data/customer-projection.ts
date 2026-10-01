export type StoredMessage = { id:string; authorName:string; body:string; visibility:"customer"|"internal"; createdAt:string };
export type StoredTessera = {
  id:string; number:string; organizationId:string; projectId:string; title:string; description:string;
  status:string; mark:string; assigneeName:string|null; messages:StoredMessage[];
};

/** Build an explicit customer response instead of returning a database row and hiding fields in the browser. */
export function toCustomerTessera(record:StoredTessera){
  return {
    id:record.id,
    number:record.number,
    projectId:record.projectId,
    title:record.title,
    description:record.description,
    status:record.status,
    messages:record.messages.filter(message=>message.visibility==="customer").map(message=>({id:message.id,authorName:message.authorName,body:message.body,createdAt:message.createdAt})),
  };
}
