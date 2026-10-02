"use client";

import { FormEvent, useEffect, useState } from "react";
import { handleAuthCallback, login, requestPasswordRecovery, updateUser, acceptInvite } from "@netlify/identity";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

export default function LoginPage(){
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [mode,setMode]=useState<"login"|"forgot"|"reset"|"invite">("login"),[token,setToken]=useState(""),[confirmation,setConfirmation]=useState(""),[message,setMessage]=useState("");
  useEffect(()=>{void handleAuthCallback().then(result=>{if(result?.type==="recovery")setMode("reset");else if(result?.type==="invite"){setToken(result.token||"");setMode("invite");}else if(result)window.location.assign("/");}).catch(()=>setError("That sign-in link is no longer valid. Request a new password reset email."));},[]);
  async function submit(event:FormEvent){
    event.preventDefault();setError("");setMessage("");
    if((mode==="reset"||mode==="invite")&&password!==confirmation){setError("Passwords must match.");return;}
    setBusy(true);
    try{
      if(mode==="forgot"){await requestPasswordRecovery(email);setMessage("If an account exists for this address, check your email for a password reset link.");}
      else {if(mode==="reset")await updateUser({password});else if(mode==="invite")await acceptInvite(token,password);else await login(email,password);window.location.assign("/");}
    }catch{setError(mode==="login"?"We couldn’t sign you in. Check your email and password, then try again.":"Unable to complete this request. Try again or request a new reset link.");}
    finally{setBusy(false);}
  }  return <main className="login-shell"><section className="login-story"><div className="login-brand"><b>T</b><span>Tessera</span></div><div><small>THE TOKEN OF SHARED PURPOSE</small><h1>One place for every request, commitment, and conversation.</h1><p>Tessera keeps consulting teams and their clients aligned from the first question through resolution.</p></div><footer><ShieldCheck/><span>Access is isolated by client, project, and role.</span></footer></section><section className="login-panel"><form onSubmit={submit}><span className="login-icon"><KeyRound/></span><small>WELCOME BACK</small><h2>{mode==="forgot"?"Reset your password":mode==="reset"||mode==="invite"?"Set your password":"Sign in to Tessera"}</h2><p>Use the account from your Tessera invitation.</p>{(mode==="login"||mode==="forgot")&&<label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com"/></label>}{mode!=="forgot"&&<label>Password<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Your password" minLength={mode==="login"?undefined:8}/></label>}{(mode==="reset"||mode==="invite")&&<label>Confirm password<input type="password" autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}{message&&<p role="status">{message}</p>}{error&&<div className="login-error" role="alert">{error}</div>}<button className="primary login-submit" disabled={busy}>{busy?"Please wait…":<>{mode==="forgot"?"Send reset link":mode==="login"?"Sign in":"Save password"}<ArrowRight/></>}</button>{(mode==="login"||mode==="forgot")&&<button type="button" className="role-switch" disabled={busy} onClick={()=>{setMode(mode==="login"?"forgot":"login");setError("");setMessage("");setPassword("");}}>{mode==="login"?"Forgot password?":"Back to sign in"}</button>}<small className="login-help">Need access? Ask your Tessera administrator for an invitation.</small></form></section></main>;
}
