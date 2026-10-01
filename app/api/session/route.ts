import { getCurrentViewer } from "@/lib/auth/current-viewer";

export const dynamic="force-dynamic";
export async function GET(){
  const viewer=await getCurrentViewer();
  return viewer?Response.json({viewer}):Response.json({viewer:null},{status:401});
}

