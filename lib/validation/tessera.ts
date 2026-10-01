export type TesseraInput={title:string;description:string;organizationId:string;projectId:string;mark:string};
export type ValidationResult={valid:true;value:TesseraInput}|{valid:false;errors:Partial<Record<keyof TesseraInput,string>>};
const marks=new Set(["urgent","high","normal","low"]);

export function validateTesseraInput(input:Partial<TesseraInput>):ValidationResult{
 const title=(input.title??"").trim(),description=(input.description??"").trim(),organizationId=(input.organizationId??"").trim(),projectId=(input.projectId??"").trim(),mark=(input.mark??"normal").toLowerCase();
 const errors:Partial<Record<keyof TesseraInput,string>>={};
 if(title.length<5) errors.title="Use at least 5 characters"; else if(title.length>160) errors.title="Use 160 characters or fewer";
 if(description.length<10) errors.description="Include at least 10 characters of context"; else if(description.length>10000) errors.description="Description is too long";
 if(!organizationId) errors.organizationId="Choose an organization";
 if(!projectId) errors.projectId="Choose a project";
 if(!marks.has(mark)) errors.mark="Choose a valid Mark";
 if(Object.keys(errors).length) return {valid:false,errors};
 return {valid:true,value:{title,description,organizationId,projectId,mark}};
}

export function validateMessage(body:string){const value=body.trim();return value.length===0?{valid:false,error:"Reply cannot be empty"}:value.length>20000?{valid:false,error:"Reply is too long"}:{valid:true,value} as const}
