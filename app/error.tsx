"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="state-page"><div className="state-brand"><b>T</b>Tessera</div><section><h1>We couldn’t load this workspace</h1><p>Your data has not been changed. Try loading it again.</p><button className="primary" onClick={reset}>Try again</button></section></main>}
