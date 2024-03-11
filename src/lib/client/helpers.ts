import { browser } from '$app/environment';

function isMobileDevice(): boolean {
  if (!browser) {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase(),
  );
  const hasTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;
  return isMobileUA || hasTouch;
}

export const isMobile = isMobileDevice();
