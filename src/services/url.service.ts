export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildFinalUrl(
  destinationUrl: string,
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): string {
  const url = new URL(destinationUrl);

  if (utmParams.utm_source)
    url.searchParams.set("utm_source", utmParams.utm_source);
  if (utmParams.utm_medium)
    url.searchParams.set("utm_medium", utmParams.utm_medium);
  if (utmParams.utm_campaign)
    url.searchParams.set("utm_campaign", utmParams.utm_campaign);
  if (utmParams.utm_term) url.searchParams.set("utm_term", utmParams.utm_term);
  if (utmParams.utm_content)
    url.searchParams.set("utm_content", utmParams.utm_content);

  return url.toString();
}
