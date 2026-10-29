import { DESK_UI_BOOT } from "@/lib/desk-ui";

const PWA_BOOT = `(()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js",{scope:"/"})})();`;

/** Inline boot — no React client bundle. Desk/Today stay server-rendered. */
export function PwaBoot() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DESK_UI_BOOT }} />
      <script dangerouslySetInnerHTML={{ __html: PWA_BOOT }} />
    </>
  );
}
