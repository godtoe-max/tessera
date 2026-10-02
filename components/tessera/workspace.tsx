"use client";

import { Building2, Clock3, Inbox, LayoutDashboard, Menu, MessageSquare, Plus, Search, Settings, Users, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { canSeeInternalMessages, canWrite, type Viewer } from "@/lib/auth/authorization";
import { AdministrationPanel } from "@/components/tessera/administration-panel";

type SessionViewer = Viewer & { displayName:string; accountType:"consultant"|"customer" };
type Ticket = { id:string; number:string; title:string; description?:string; organizationId:string; projectId:string; organizationName?:string; projectName?:string; requesterName?:string; assigneeId?:string|null; assigneeName?:string|null; status:string; mark?:string; updatedAt:string; dueAt?:string|null };
type Message = { id:string; body:string; authorName:string; visibility?:string; createdAt:string };
type Catalog = { organizations:{id:string;name:string}[]; projects:{id:string;name:string;organizationId:string;canCreate:boolean}[]; settings?:{name:string;defaultMark:string} };
type Detail = { tessera:Ticket; messages:Message[] };
type View = "Overview"|"Tesserae"|"Clients"|"Team"|"Settings";
const statuses:Record<string,string> = {open:"Open",in_progress:"In progress",waiting:"Waiting",redeemed:"Redeemed"};
const marks:Record<string,string> = {urgent:"Urgent",high:"High",normal:"Normal",low:"Low"};
const emptyCatalog:Catalog = {organizations:[],projects:[]};
const date = (value?:string|null)=>value?new Date(value).toLocaleString():"Not set";
const dueToday = (ticket:Ticket)=>Boolean(ticket.dueAt&&new Date(ticket.dueAt).toDateString()===new Date().toDateString());

async function api<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,credentials:"same-origin",cache:"no-store"});
  if(response.status===401){window.location.replace("/login");throw new Error("Please sign in to continue.");}
  const body=await response.json();
  if(!response.ok) throw new Error(body.error||Object.values(body.errors||{}).join(". ")||"Unable to complete the request.");
  return body;
}
const errorText=(error:unknown)=>error instanceof Error?error.message:"Unable to complete the request.";

export default function Workspace({initialView="Tesserae"}:{initialView?:View}){
  const [viewer,setViewer]=useState<SessionViewer|null>(null);
  const [tickets,setTickets]=useState<Ticket[]>([]),[catalog,setCatalog]=useState<Catalog>(emptyCatalog);
  const [selected,setSelected]=useState<string|null>(null),[detail,setDetail]=useState<Detail|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[attempt,setAttempt]=useState(0);
  const [detailResult,setDetailResult]=useState<{id:string;version:number;error?:string}|null>(null),[detailVersion,setDetailVersion]=useState(0);
  const [query,setQuery]=useState(""),[queue,setQueue]=useState("All Tesserae"),[view,setView]=useState<View>(initialView);
  const [modal,setModal]=useState(false),[nav,setNav]=useState(false),[notice,setNotice]=useState("");
  const [creating,setCreating]=useState(false),[createError,setCreateError]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      if(/^#(recovery_token|invite_token|confirmation_token|email_change_token|access_token)=/.test(window.location.hash)){
        window.location.replace(`/login${window.location.hash}`);return;
      }
      setLoading(true);setError("");
      try{
        const session=await api<{viewer:SessionViewer}>("/api/session",{signal:controller.signal});
        const [list,choices]=await Promise.all([api<{tesserae:Ticket[]}>("/api/tesserae",{signal:controller.signal}),api<Catalog>("/api/catalog",{signal:controller.signal})]);
        if(controller.signal.aborted)return;
        setViewer(session.viewer);setTickets(list.tesserae);setCatalog(choices);
      }catch(error){if(!controller.signal.aborted)setError(errorText(error));}
      finally{if(!controller.signal.aborted)setLoading(false);}
    }
    void load();return ()=>controller.abort();
  },[attempt]);
  const customer=viewer?.accountType==="customer";
  const shown=useMemo(()=>tickets.filter(ticket=>(customer||queue==="All Tesserae"||queue==="My Tesserae"&&ticket.assigneeId===viewer?.userId||queue==="Unassigned"&&!ticket.assigneeId||queue==="Due today"&&dueToday(ticket))&&`${ticket.number} ${ticket.title} ${ticket.organizationName||""} ${ticket.projectName||""}`.toLowerCase().includes(query.toLowerCase())),[tickets,customer,queue,viewer?.userId,query]);
  const active=shown.find(ticket=>ticket.id===selected)||shown[0];
  const activeId=active?.id;
  const detailCurrent=detailResult?.id===activeId&&detailResult?.version===detailVersion;
  const detailLoading=Boolean(activeId&&!detailCurrent);
  const detailError=detailCurrent?detailResult?.error:"";
  useEffect(()=>{
    const controller=new AbortController();
    if(!activeId)return ()=>controller.abort();
    api<Detail>(`/api/tesserae/${encodeURIComponent(activeId)}`,{signal:controller.signal})
      .then(result=>{if(!controller.signal.aborted){setDetail(result);setDetailResult({id:activeId,version:detailVersion});}})
      .catch(error=>{if(!controller.signal.aborted)setDetailResult({id:activeId,version:detailVersion,error:errorText(error)});});
    return ()=>controller.abort();
  },[activeId,detailVersion]);
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(creating)return;
    const form=new FormData(event.currentTarget),project=catalog.projects.find(project=>project.id===form.get("projectId")&&project.canCreate);
    if(!project){setCreateError("Choose an available project.");return;}
    setCreating(true);setCreateError("");
    try{
      const result=await api<{tessera:Ticket}>("/api/tesserae",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:form.get("title"),description:form.get("description"),organizationId:project.organizationId,projectId:project.id,mark:customer?"normal":form.get("mark")})});
      setTickets(current=>[result.tessera,...current]);setSelected(result.tessera.id);setQueue("All Tesserae");setQuery("");setView("Tesserae");setModal(false);setNotice(`${result.tessera.number} was opened.`);
    }catch(error){setCreateError(errorText(error));}finally{setCreating(false);}
  }
  async function sendMessage(id:string,body:string,visibility:"customer"|"internal"){
    await api(`/api/tesserae/${encodeURIComponent(id)}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body,visibility})});
    setTickets(current=>current.map(ticket=>ticket.id===id?{...ticket,updatedAt:new Date().toISOString()}:ticket));
    setDetailVersion(value=>value+1);setNotice(visibility==="internal"?"Internal note saved.":"Reply sent.");
  }
  if(loading)return <State title="Loading your workspace" busy/>;
  async function refreshCatalog(){setCatalog(await api<Catalog>("/api/catalog"));}
  if(error||!viewer)return <State title="Unable to load your workspace" message={error||"Please sign in to continue."} retry={()=>setAttempt(value=>value+1)}/>;
  const canCreate=catalog.projects.some(project=>project.canCreate);
  const newButton=<button className="primary" disabled={!canCreate} onClick={()=>{setCreateError("");setModal(true);}}><Plus/>{customer?"Open a Tessera":"New Tessera"}</button>;
  const board=<div className={customer?"portal-grid":"board"}><TicketList tickets={shown} activeId={activeId} select={setSelected}/><aside className={customer?"portal-detail":"detail"}>{!active?<div className="empty"><b>No request selected</b><span>Open a Tessera or choose another queue.</span></div>:detailLoading?<div className="empty" role="status">Loading conversation…</div>:detailError?<div className="empty" role="alert"><p>{detailError}</p><button onClick={()=>setDetailVersion(value=>value+1)}>Retry</button></div>:detail&&detail.tessera.id===activeId?<TicketDetail key={detail.tessera.id} detail={detail} viewer={viewer} send={sendMessage}/>:null}</aside></div>;
  const dialog=<CreateDialog open={modal} close={setModal} customer={customer} catalog={catalog} submit={create} busy={creating} error={createError}/>;
  const notification=notice&&<div className="confirmation" role="status">{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice("")}><X/></button></div>;
  if(customer)return <main className="portal"><header className="portal-header"><div className="portal-brand"><b>T</b><span>Tessera<small>Customer support</small></span></div><div className="portal-user"><strong>{initials(viewer.displayName)}</strong><span>{viewer.displayName}<small>Customer portal</small></span></div></header><section className="portal-content">{notification}<div className="portal-title"><div><small>Your service desk</small><h1>How can we help?</h1><p>Follow requests from your authorized projects.</p></div>{newButton}</div><div className="summary">{["open","in_progress","waiting"].map(status=><article key={status}><span>{statuses[status]}</span><b>{tickets.filter(ticket=>ticket.status===status).length}</b></article>)}</div><label className="search"><Search/><input aria-label="Search requests" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search requests"/></label>{board}</section>{dialog}</main>;
  const queues:[string,number][]=[["My Tesserae",tickets.filter(ticket=>ticket.assigneeId===viewer.userId).length],["Unassigned",tickets.filter(ticket=>!ticket.assigneeId).length],["Due today",tickets.filter(dueToday).length],["All Tesserae",tickets.length]];
  return <main className="shell"><aside className={`side ${nav?"open":""}`}><div className="brand"><b>T</b>{catalog.settings?.name||"Tessera"}<button aria-label="Close navigation" onClick={()=>setNav(false)}><X/></button></div><nav>{([[LayoutDashboard,"Overview"],[Inbox,"Tesserae"],[Building2,"Clients"],[Users,"Team"],[Settings,"Settings"]] as const).map(([Icon,name])=><a className={view===name?"active":""} href={name==="Tesserae"?"/":`/${name.toLowerCase()}`} key={name}><Icon/>{name}</a>)}</nav>{view==="Tesserae"&&<><p className="section">Queues</p>{queues.map(([name,count])=><button className={`queue ${queue===name?"chosen":""}`} onClick={()=>setQueue(name)} key={name}><span>{name}</span><i>{count}</i></button>)}</>}<footer><div className="person"><strong>{initials(viewer.displayName)}</strong><span><b>{viewer.displayName}</b><small>Consultant workspace</small></span></div></footer></aside><section className="main"><header><button className="menu" aria-label="Open navigation" onClick={()=>setNav(true)}><Menu/></button><label className="search"><Search/><input aria-label="Search Tesserae" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search Tesserae, clients, projects…"/></label>{newButton}</header>{notification}<div className="title"><div><small>Client service</small><h1>{view==="Tesserae"?queue:view}</h1><p>{view==="Tesserae"?`${shown.length} Tesserae across your authorized engagements`:"Your consulting workspace"}</p></div></div>{view==="Tesserae"?board:view==="Overview"?<LivePanel view={view} tickets={tickets} catalog={catalog}/>:<AdministrationPanel view={view} viewer={viewer} onChanged={refreshCatalog}/>}</section>{dialog}</main>;
}

function initials(name:string){return name.split(" ").map(part=>part[0]).slice(0,2).join("");}
function State({title,message,busy,retry}:{title:string;message?:string;busy?:boolean;retry?:()=>void}){return <main className="state-page"><div className="state-brand"><b>T</b>Tessera</div><section aria-live="polite">{busy&&<span className="state-spinner"/>}<h1>{title}</h1>{message&&<p role="alert">{message}</p>}{retry&&<button className="primary" onClick={retry}>Try again</button>}</section></main>;}
function TicketList({tickets,activeId,select}:{tickets:Ticket[];activeId?:string;select:(id:string)=>void}){
  const [status,setStatus]=useState(""),[mark,setMark]=useState(""),[sort,setSort]=useState("updated");
  const filtered=tickets.filter(ticket=>(!status||ticket.status===status)&&(!mark||ticket.mark===mark)).sort((a,b)=>sort==="number"?b.number.localeCompare(a.number,undefined,{numeric:true}):sort==="due"?(a.dueAt?new Date(a.dueAt).getTime():Infinity)-(b.dueAt?new Date(b.dueAt).getTime():Infinity):new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime());
  return <section className="list"><div className="list-tools"><select aria-label="Filter by status" value={status} onChange={event=>setStatus(event.target.value)}><option value="">All statuses</option>{Object.entries(statuses).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><select aria-label="Filter by Mark" value={mark} onChange={event=>setMark(event.target.value)}><option value="">All Marks</option>{Object.entries(marks).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><select aria-label="Sort Tesserae" value={sort} onChange={event=>setSort(event.target.value)}><option value="updated">Recently updated</option><option value="due">Due date</option><option value="number">Tessera number</option></select></div><div className="columns"><span>Request</span><span>Status</span></div>{filtered.map(ticket=><button className={`ticket ${activeId===ticket.id?"selected":""}`} onClick={()=>select(ticket.id)} key={ticket.id}><i className={`bar ${marks[ticket.mark||"normal"]}`}/><span><small>{ticket.number} · {ticket.organizationName}</small><b>{ticket.title}</b><em>{ticket.projectName} · Updated {date(ticket.updatedAt)}</em></span><span><strong className={`status ${(statuses[ticket.status]||ticket.status).replaceAll(" ","")}`}>{statuses[ticket.status]}</strong><small><Clock3/>{date(ticket.dueAt)}</small></span></button>)}{!filtered.length&&<div className="empty"><Search/><b>No matching Tesserae</b><span>Open a request or change your search and filters.</span></div>}<footer className="list-footer">Showing {filtered.length} of {tickets.length}</footer></section>;
}
function TicketDetail({detail,viewer,send}:{detail:Detail;viewer:SessionViewer;send:(id:string,body:string,visibility:"customer"|"internal")=>Promise<void>}){
  const ticket=detail.tessera;
  const [body,setBody]=useState(""),[internal,setInternal]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [pending,setPending]=useState<Message|null>(null);
  const writable=canWrite(viewer,ticket),notes=viewer.accountType==="consultant"&&canSeeInternalMessages(viewer,ticket);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!body.trim())return;
    setBusy(true);setError("");
    const visibility=notes&&internal?"internal":"customer";
    setPending({id:"pending",body:body.trim(),authorName:viewer.displayName,visibility,createdAt:new Date().toISOString()});
    try{await send(ticket.id,body,visibility);setBody("");}
    catch(error){setPending(null);setError(errorText(error));}finally{setBusy(false);}
  }
  return <><div className="number">{ticket.number}</div><h2>{ticket.title}</h2><div className="badges"><span>{statuses[ticket.status]}</span>{viewer.accountType==="consultant"&&<span>{marks[ticket.mark||"normal"]} Mark</span>}</div><p className="description">{ticket.description}</p><dl><div><dt>Client</dt><dd>{ticket.organizationName}</dd></div><div><dt>Project</dt><dd>{ticket.projectName}</dd></div><div><dt>Requested by</dt><dd>{ticket.requesterName}</dd></div>{viewer.accountType==="consultant"&&<div><dt>Assignee</dt><dd>{ticket.assigneeName||"Unassigned"}</dd></div>}<div><dt>Due</dt><dd>{date(ticket.dueAt)}</dd></div></dl><h3>Conversation <small>{detail.messages.length} messages</small></h3>{(detail.messages.length||pending)?[...detail.messages,...(pending?[pending]:[])].map(message=><div className={`event ${message.visibility==="internal"?"internal":""}`} key={message.id}><MessageSquare/><p><b>{message.authorName}</b>{message.visibility==="internal"&&<small>Internal note</small>}<span className="message-body">{message.body}</span><small>{message.id==="pending"?"Sending…":date(message.createdAt)}</small></p></div>):<p>No messages yet.</p>}{writable?<form onSubmit={submit}>{notes&&<div className="compose-tabs"><button type="button" disabled={busy} className={!internal?"active":""} onClick={()=>setInternal(false)}>Customer reply</button><button type="button" disabled={busy} className={internal?"active":""} onClick={()=>setInternal(true)}>Internal note</button></div>}<div className={`reply ${internal?"internal":""}`}><textarea aria-label={internal?"Internal note":"Reply"} maxLength={20000} required disabled={busy} value={body} onChange={event=>setBody(event.target.value)} placeholder={internal?"Add a note only consultants can see…":"Write a reply…"}/>{error&&<p className="login-error" role="alert">{error}</p>}<div><button disabled={busy||!body.trim()}>{busy?"Sending…":internal?"Save note":"Send reply"}</button></div></div></form>:<p>Your account has read-only access to this request.</p>}</>;
}
function CreateDialog({open,close,customer,catalog,submit,busy,error}:{open:boolean;close:(open:boolean)=>void;customer:boolean;catalog:Catalog;submit:(event:FormEvent<HTMLFormElement>)=>void;busy:boolean;error:string}){
  const available=catalog.projects.filter(project=>project.canCreate);
  return <Dialog open={open} onOpenChange={value=>{if(!busy)close(value);}}><DialogContent className="modal"><DialogHeader><DialogTitle>Open a new Tessera</DialogTitle><DialogDescription>Choose a project and describe the help you need.</DialogDescription></DialogHeader><form onSubmit={submit}><fieldset disabled={busy} className="tessera-form-fields"><label>Title<input autoFocus required minLength={5} maxLength={160} name="title" placeholder="What needs attention?"/></label><label>Project<select required name="projectId" defaultValue=""><option value="" disabled>Choose a project</option>{available.map(project=><option value={project.id} key={project.id}>{catalog.organizations.find(org=>org.id===project.organizationId)?.name} · {project.name}</option>)}</select></label>{!customer&&<label>Mark<select name="mark" defaultValue={catalog.settings?.defaultMark||"normal"}>{Object.entries(marks).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>}<label>Description<textarea required minLength={10} maxLength={10000} name="description" placeholder="Include the context your consulting team will need."/></label>{error&&<p className="login-error" role="alert">{error}</p>}<footer><button type="button" onClick={()=>close(false)}>Cancel</button><button className="primary" disabled={!available.length}>{busy?"Opening…":"Open Tessera"}</button></footer></fieldset></form></DialogContent></Dialog>;
}
function LivePanel({view,tickets,catalog}:{view:Exclude<View,"Tesserae">;tickets:Ticket[];catalog:Catalog}){
  if(view==="Overview")return <div className="workspace-panel"><section className="metric-grid">{[["Active Tesserae",tickets.filter(ticket=>ticket.status!=="redeemed").length],["Due today",tickets.filter(dueToday).length],["Urgent Mark",tickets.filter(ticket=>ticket.mark==="urgent").length],["Unassigned",tickets.filter(ticket=>!ticket.assigneeId).length]].map(([label,count])=><article className="metric" key={label}><div><small>{label}</small><b>{count}</b></div></article>)}</section></div>;
  if(view==="Clients")return <div className="workspace-panel"><section className="client-grid">{catalog.organizations.map(org=><article className="client-card" key={org.id}><h2>{org.name}</h2><p>{tickets.filter(ticket=>ticket.organizationId===org.id).length} Tesserae</p><h3>Projects</h3>{catalog.projects.filter(project=>project.organizationId===org.id).map(project=><p key={project.id}>{project.name}</p>)}</article>)}</section>{!catalog.organizations.length&&<p>No active projects are available to your account.</p>}</div>;
  return <div className="workspace-panel"><article className="panel-card"><h2>{view==="Team"?"Accounts and access":"Workspace settings"}</h2><p>{view==="Team"?"Account administration is being connected. Invitations and role changes will be available here.":"Workspace administration is being connected. Settings controls will be available here."}</p></article></div>;
}

