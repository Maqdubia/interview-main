/**
 * Returns true when the app is running as an installed PWA
 * (standalone display mode on Android/desktop or iOS Safari).
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari exposes navigator.standalone
  const ios = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mq || ios);
}

/**
 * Guarded service worker registration for PWA.
 *
 * In Lovable's preview iframe, service workers cause stale content and
 * navigation interference. We unregister any SW in those contexts and
 * only register on the real published domain.
 */
export function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  // Production: register the auto-generated SW from vite-plugin-pwa
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      /* no-op */
    });
}
