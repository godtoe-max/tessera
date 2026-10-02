import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, projects, workspaceSettings } from "@/db/schema";
import { apiError } from "@/lib/api/responses";
import { requireCurrentViewer } from "@/lib/auth/current-viewer";
import { projectsForViewer } from "@/lib/data/catalog-policy";

export const dynamic="force-dynamic";
export async function GET(){
  try{
    const viewer=await requireCurrentViewer();
    const db=getDb();
    const rows=await db.select({id:projects.id,organizationId:projects.organizationId,name:projects.name,organizationName:organizations.name})
      .from(projects).innerJoin(organizations,eq(projects.organizationId,organizations.id))
      .where(and(eq(projects.active,true),eq(organizations.active,true)));
    const visible=projectsForViewer(viewer,rows);
    const orgs=[...new Map(visible.map(project=>[project.organizationId,{id:project.organizationId,name:rows.find(row=>row.id===project.id)!.organizationName}])).values()];
    const settings=(await db.select({name:workspaceSettings.name,defaultMark:workspaceSettings.defaultMark}).from(workspaceSettings).where(eq(workspaceSettings.id,"workspace")))[0]??{name:"Tessera",defaultMark:"normal"};
    return Response.json({organizations:orgs,projects:visible,settings});
  }catch(error){return apiError(error);}
}

