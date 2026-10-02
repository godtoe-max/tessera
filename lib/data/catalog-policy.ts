import { canRead, canWrite, type Viewer } from "../auth/authorization.ts";

export type CatalogProject = { id:string; organizationId:string; name:string };
export function projectsForViewer(viewer:Viewer, projects:CatalogProject[]){
  return projects.filter(project=>canRead(viewer,{organizationId:project.organizationId,projectId:project.id}))
    .map(project=>({...project,canCreate:canWrite(viewer,{organizationId:project.organizationId,projectId:project.id})}));
}
