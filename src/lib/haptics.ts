// Tiny haptic helper. No-ops where unsupported (iOS Safari).
export function haptic(pattern: number | number[] = 10) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* no-op */
  }
}

export const tap = () => haptic(8);
export const success = () => haptic([10, 40, 20]);
export const warn = () => haptic([30, 30, 30]);
