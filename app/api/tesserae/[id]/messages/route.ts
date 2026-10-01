import { verifyRequestOrigin } from "@netlify/identity";
import { apiError } from "@/lib/api/responses";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { NetlifyTesseraRepository } from "@/lib/data/netlify-tessera-repository";
import { TesseraService } from "@/lib/services/tessera-service";
import { validateMessage } from "@/lib/validation/tessera";

const service=new TesseraService(new NetlifyTesseraRepository());
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    verifyRequestOrigin(request);
    const viewer=await requireCurrentViewer(),{id}=await params,body=await request.json();
    const message=validateMessage(String(body.body??""));
    if(!message.valid) return Response.json({error:message.error},{status:400});
    const visibility=body.visibility==="internal"?"internal":"customer";
    if(!await service.addMessage(viewer,id,message.value!,visibility)) return Response.json({error:"Resource not found"},{status:404});
    return Response.json({ok:true},{status:201});
  }catch(error){return apiError(error);}
}

