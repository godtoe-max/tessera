import { requireRead, requireWrite, type ResourceScope, type Viewer } from "../auth/authorization.ts";

export const MAX_ATTACHMENT_BYTES=20*1024*1024;
const allowedTypes=new Set(["application/pdf","image/png","image/jpeg","text/plain","text/csv","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export function validateAttachment(viewer:Viewer,scope:ResourceScope,file:{name:string;type:string;size:number}){
  requireWrite(viewer,scope);
  if(!file.name.trim()||file.name.includes("/")||file.name.includes("\\")) return {ok:false,reason:"Invalid filename"} as const;
  if(file.size<1||file.size>MAX_ATTACHMENT_BYTES) return {ok:false,reason:"File must be 20 MB or smaller"} as const;
  if(!allowedTypes.has(file.type.toLowerCase())) return {ok:false,reason:"File type is not allowed"} as const;
  return {ok:true} as const;
}

export function authorizeAttachmentDownload(viewer:Viewer,scope:ResourceScope){
  requireRead(viewer,scope);
}

export function attachmentStorageKey(scope:ResourceScope,tesseraId:string,attachmentId:string,filename:string){
  const safe=filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)||"attachment";
  return `organizations/${scope.organizationId}/tesserae/${tesseraId}/${attachmentId}/${safe}`;
}
