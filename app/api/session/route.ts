import { getCurrentViewer } from "@/lib/auth/current-viewer";
import { apiError } from "@/lib/api/responses";

export const dynamic="force-dynamic";
export async function GET(){
  try{
    const viewer=await getCurrentViewer();
    return viewer?Response.json({viewer}):Response.json({viewer:null},{status:401});
  }catch(error){return apiError(error);}
}
