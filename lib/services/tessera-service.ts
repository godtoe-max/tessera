import { canSeeInternalMessages, requireRead, requireWrite, type Viewer } from "../auth/authorization.ts";
import type { NewTessera, TesseraRepository } from "../data/tessera-repository.ts";

export class TesseraService {
  private readonly repository:TesseraRepository;
  constructor(repository:TesseraRepository){ this.repository=repository; }

  async list(viewer:Viewer){
    const records=await this.repository.listForViewer(viewer);
    return records.filter(record=>{
      try { requireRead(viewer,record); return true; } catch { return false; }
    });
  }

  async get(viewer:Viewer,id:string){
    const record=await this.repository.findForViewer(viewer,id);
    if(!record) return null;
    requireRead(viewer,record);
    return record;
  }

  async create(viewer:Viewer,input:NewTessera){
    requireWrite(viewer,input);
    return this.repository.createForViewer(viewer,input);
  }

  async addMessage(viewer:Viewer,tesseraId:string,body:string,visibility:"customer"|"internal"){
    const record=await this.repository.findForViewer(viewer,tesseraId);
    if(!record) return false;
    requireWrite(viewer,record);
    if(visibility==="internal"&&!canSeeInternalMessages(viewer,record)) return false;
    const trimmed=body.trim();
    if(!trimmed) return false;
    await this.repository.addMessage(viewer,tesseraId,trimmed,visibility);
    return true;
  }
}
