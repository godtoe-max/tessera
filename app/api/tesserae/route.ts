import { apiError } from "@/lib/api/responses";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { NetlifyTesseraRepository } from "@/lib/data/netlify-tessera-repository";
import { TesseraService } from "@/lib/services/tessera-service";
import { validateTesseraInput } from "@/lib/validation/tessera";
import { verifyRequestOrigin } from "@/lib/auth/request-origin";

export const dynamic="force-dynamic";
const service=new TesseraService(new NetlifyTesseraRepository());

export async function GET(){try{return Response.json({tesserae:await service.list(await requireCurrentViewer())});}catch(error){return apiError(error);}}
export async function POST(request:Request){
  try{
    verifyRequestOrigin(request);
    const viewer=await requireCurrentViewer();
    const parsed=validateTesseraInput(await request.json());
    if(!parsed.valid) return Response.json({errors:parsed.errors},{status:400});
    const tessera=await service.create(viewer,{...parsed.value,requesterId:viewer.userId,mark:parsed.value.mark as "urgent"|"high"|"normal"|"low"});
    return Response.json({tessera},{status:201});
  }catch(error){return apiError(error);}
}

