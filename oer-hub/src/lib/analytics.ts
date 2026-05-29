/**
 * Analytics stub. Call trackEvent at each meaningful action.
 * In dev, events are logged to the console.
 * Swap in a real provider (Segment, Mixpanel, PostHog, etc.) here when ready.
 */
export function trackEvent(
  name: string,
  props?: Record<string, unknown>,
): void {
  if (import.meta.env.DEV) {
    console.log("[analytics]", name, props ?? {});
  }
  // TODO: replace with real provider call, e.g.:
  // analytics.track(name, props);
}
