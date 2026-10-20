/** Browsers that cannot fire beforeinstallprompt and need Safari-style steps. */
export function isIosLike(ua: string, maxTouchPoints = 0) {
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && maxTouchPoints > 1;
}

/** WhatsApp / Instagram / Facebook in-app browsers cannot add to Home Screen. */
export function isInAppBrowser(ua: string) {
  return /WhatsApp|FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|MicroMessenger|GSA\//i.test(ua);
}
