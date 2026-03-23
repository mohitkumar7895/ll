/**
 * Mobile browsers (esp. iOS Safari) often block getUserMedia unless it runs
 * in direct response to a user tap. Desktop can usually auto-start.
 */
export function needsCameraUserGesture() {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const ios =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const coarse = window.matchMedia?.("(pointer: coarse)").matches === true;
  return ios || coarse;
}
