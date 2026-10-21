const PWA_BOOT = `(()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js",{scope:"/"})})();`;

/** Inline boot — no React client bundle. Desk/Today stay server-rendered. */
export function PwaBoot() {
  return <script dangerouslySetInnerHTML={{ __html: PWA_BOOT }} />;
}
