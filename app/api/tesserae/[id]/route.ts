import { apiError } from "@/lib/api/responses";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { listMessagesForViewer, NetlifyTesseraRepository } from "@/lib/data/netlify-tessera-repository";
import { TesseraService } from "@/lib/services/tessera-service";

export const dynamic="force-dynamic";
const service=new TesseraService(new NetlifyTesseraRepository());
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const viewer=await requireCurrentViewer(),{id}=await params,tessera=await service.get(viewer,id);
    if(!tessera) return Response.json({error:"Resource not found"},{status:404});
    return Response.json({tessera,messages:await listMessagesForViewer(viewer,tessera)});
  }catch(error){return apiError(error);}
}

