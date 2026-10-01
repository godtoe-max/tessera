import type { ResourceScope, Viewer } from "@/lib/auth/authorization";

export type TesseraSummary = ResourceScope & {
  id:string; number:string; title:string; description?:string;
  status:"open"|"in_progress"|"waiting"|"redeemed";
  mark?:"urgent"|"high"|"normal"|"low";
  requesterId?:string; requesterName?:string; assigneeId?:string|null; assigneeName?:string|null;
  organizationName?:string; projectName?:string; dueAt?:Date|null; createdAt?:Date; updatedAt:Date;
};
export type NewTessera = ResourceScope & { requesterId:string; title:string; description:string; mark:"urgent"|"high"|"normal"|"low" };

/** Server-only contract. The Netlify Postgres implementation will be added after the site is linked. */
export interface TesseraRepository {
  listForViewer(viewer:Viewer):Promise<TesseraSummary[]>;
  findForViewer(viewer:Viewer,id:string):Promise<TesseraSummary|null>;
  createForViewer(viewer:Viewer,input:NewTessera):Promise<TesseraSummary>;
  addMessage(viewer:Viewer,tesseraId:string,body:string,visibility:"customer"|"internal"):Promise<void>;
}

