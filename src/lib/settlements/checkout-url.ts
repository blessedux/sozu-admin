import "server-only";

/** SozuPay base URL — ramp checkout routes live here, not on the admin app. */
function sozuPayBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SOZUPAY_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function adminBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

/**
 * Checkout sessions store provider_url from SozuPay. When NEXT_PUBLIC_APP_URL was
 * mis-set to the admin port, links point at /ramp/stub-checkout on :3001 (404).
 * Rewrite ramp URLs (and embedded redirect) to SozuPay.
 */
export function resolveMerchantCheckoutProviderUrl(providerUrl: string | null): string | null {
  if (!providerUrl?.trim()) return null;

  try {
    const url = new URL(providerUrl);
    if (!url.pathname.startsWith("/ramp/")) return providerUrl;

    const payOrigin = new URL(sozuPayBaseUrl());
    url.protocol = payOrigin.protocol;
    url.host = payOrigin.host;

    const redirect = url.searchParams.get("redirect");
    if (redirect) {
      try {
        const redirectUrl = new URL(decodeURIComponent(redirect));
        if (
          redirectUrl.pathname.startsWith("/checkout/") &&
          (redirectUrl.port === "3001" || redirectUrl.origin === new URL(adminBaseUrl()).origin)
        ) {
          redirectUrl.protocol = payOrigin.protocol;
          redirectUrl.host = payOrigin.host;
          url.searchParams.set("redirect", redirectUrl.toString());
        }
      } catch {
        // keep original redirect param
      }
    }

    return url.toString();
  } catch {
    return providerUrl;
  }
}
