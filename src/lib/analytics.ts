/**
 * Google Analytics 4 utility
 * Safely wraps gtag() calls with type safety and error handling
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer?: unknown[]
  }
}

/**
 * Check if gtag is available
 */
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): void {
  if (!isGtagAvailable()) {
    // Silently fail in development or if GA is not loaded
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, eventParams)
    }
    return
  }

  try {
    window.gtag!('event', eventName, eventParams)
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error)
  }
}

/**
 * Track page view
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isGtagAvailable()) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page view:', pagePath, pageTitle)
    }
    return
  }

  try {
    window.gtag!('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    })
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error)
  }
}

/**
 * Initialize analytics (called after GA script loads)
 */
export function initAnalytics(measurementId: string): void {
  if (typeof window === 'undefined') return

  // Create dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || []

  // Define gtag function
  function gtag(
    _command: 'config' | 'event' | 'set' | 'js',
    _targetId: string | Date,
    _config?: Record<string, unknown>
  ): void {
    window.dataLayer!.push(arguments)
  }

  window.gtag = gtag

  // Configure GA4
  gtag('js', new Date())
  gtag('config', measurementId, {
    send_page_view: false, // We'll track page views manually
  })
}

