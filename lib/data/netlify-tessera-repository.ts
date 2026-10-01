import "server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, organizations, projects, tesseraEvents, tesserae, users } from "@/db/schema";
import { authorizedOrganizationIds, canSeeInternalMessages, type Viewer } from "@/lib/auth/authorization";
import type { NewTessera, TesseraRepository, TesseraSummary } from "./tessera-repository";

const requester=users;

function scopeFor(viewer:Viewer){
  const organizations=authorizedOrganizationIds(viewer);
  if(organizations==="all") return undefined;
  const projectIds=viewer.memberships.filter(m=>m.projectId).map(m=>m.projectId!);
  if(!organizations.length) return eq(tesserae.id,"00000000-0000-0000-0000-000000000000");
  return projectIds.length
    ? or(inArray(tesserae.organizationId,organizations),inArray(tesserae.projectId,projectIds))
    : inArray(tesserae.organizationId,organizations);
}

const selection={
  id:tesserae.id,number:tesserae.number,title:tesserae.title,description:tesserae.description,
  status:tesserae.status,mark:tesserae.mark,organizationId:tesserae.organizationId,projectId:tesserae.projectId,
  requesterId:tesserae.requesterId,requesterName:requester.displayName,assigneeId:tesserae.assigneeId,
  organizationName:organizations.name,projectName:projects.name,dueAt:tesserae.dueAt,
  createdAt:tesserae.createdAt,updatedAt:tesserae.updatedAt,
};

async function rows(viewer:Viewer,id?:string):Promise<TesseraSummary[]>{
  const scope=scopeFor(viewer);
  const conditions=[scope,id?eq(tesserae.id,id):undefined].filter(Boolean);
  const result=await db.select(selection).from(tesserae)
    .innerJoin(organizations,eq(tesserae.organizationId,organizations.id))
    .innerJoin(projects,eq(tesserae.projectId,projects.id))
    .innerJoin(requester,eq(tesserae.requesterId,requester.id))
    .where(conditions.length===2?and(conditions[0],conditions[1]):conditions[0])
    .orderBy(desc(tesserae.updatedAt));
  if(!result.length) return [];
  const assigneeIds=[...new Set(result.flatMap(r=>r.assigneeId?[r.assigneeId]:[]))];
  const names=assigneeIds.length?await db.select({id:users.id,name:users.displayName}).from(users).where(inArray(users.id,assigneeIds)):[];
  const nameMap=new Map(names.map(r=>[r.id,r.name]));
  return result.map(r=>({...r,assigneeName:r.assigneeId?nameMap.get(r.assigneeId)??null:null}));
}

function number(){return `TSR-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;}

export class NetlifyTesseraRepository implements TesseraRepository {
  listForViewer(viewer:Viewer){return rows(viewer);}
  async findForViewer(viewer:Viewer,id:string){return (await rows(viewer,id))[0]??null;}
  async createForViewer(viewer:Viewer,input:NewTessera){
    const [created]=await db.insert(tesserae).values({...input,number:number()}).returning({id:tesserae.id});
    await db.insert(tesseraEvents).values({tesseraId:created.id,actorId:viewer.userId,eventType:"tessera.created",eventData:{mark:input.mark}});
    return (await this.findForViewer(viewer,created.id))!;
  }
  async addMessage(viewer:Viewer,tesseraId:string,body:string,visibility:"customer"|"internal"){
    await db.transaction(async tx=>{
      const [message]=await tx.insert(messages).values({tesseraId,authorId:viewer.userId,body,visibility}).returning({id:messages.id});
      await tx.update(tesserae).set({updatedAt:new Date()}).where(eq(tesserae.id,tesseraId));
      await tx.insert(tesseraEvents).values({tesseraId,actorId:viewer.userId,eventType:"message.created",eventData:{messageId:message.id,visibility}});
    });
  }
}

export async function listMessagesForViewer(viewer:Viewer,tessera:TesseraSummary){
  const visibility=canSeeInternalMessages(viewer,tessera)?undefined:eq(messages.visibility,"customer");
  return db.select({id:messages.id,body:messages.body,visibility:messages.visibility,createdAt:messages.createdAt,authorId:users.id,authorName:users.displayName})
    .from(messages).innerJoin(users,eq(messages.authorId,users.id))
    .where(visibility?and(eq(messages.tesseraId,tessera.id),visibility):eq(messages.tesseraId,tessera.id))
    .orderBy(messages.createdAt);
}

