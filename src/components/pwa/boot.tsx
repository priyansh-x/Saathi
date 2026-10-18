const PWA_BOOT = `(()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js",{scope:"/"});const m=location.pathname.match(/^\\/d\\/([^/]+)/);if(!m)return;fetch("/api/d/"+m[1]+"/push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:"mock://"+location.host+"/"+m[1]})})})();`;

/** Inline boot — no React client bundle. Desk/Today stay server-rendered. */
export function PwaBoot() {
  return <script dangerouslySetInnerHTML={{ __html: PWA_BOOT }} />;
}
