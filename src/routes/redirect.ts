import { Router, Request, Response } from "express";
import * as qrcodeService from "../services/qrcode.service";
import * as statsService from "../services/stats.service";
import { buildFinalUrl } from "../services/url.service";

const router = Router();

/**
 * Extract the tracking URL from a DCM impression tag
 * Supports IMG, IFRAME, and SCRIPT tag formats
 */
function extractDcmUrl(tag: string): string | null {
  if (!tag) return null;

  // Try to extract URL from SRC attribute (works for IMG, IFRAME, SCRIPT)
  const srcMatch = tag.match(/SRC\s*=\s*["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  // If the tag is just a URL, return it directly
  if (tag.startsWith("http://") || tag.startsWith("https://")) {
    return tag;
  }

  return null;
}

/**
 * Process DCM URL - replace [timestamp] with actual timestamp for cache busting
 */
function processDcmUrl(url: string): string {
  return url.replace(/\[timestamp\]/gi, Date.now().toString());
}

/**
 * Generate HTML page that fires DCM tracking pixel and redirects
 * Uses meta refresh for redirect to avoid CSP issues with inline scripts
 */
function generateTrackingPage(dcmTag: string, finalUrl: string): string {
  const dcmUrl = extractDcmUrl(dcmTag);
  const processedDcmUrl = dcmUrl ? processDcmUrl(dcmUrl) : null;

  // Escape URL for use in HTML attributes
  const escapedFinalUrl = finalUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="1;url=${escapedFinalUrl}">
</head>
<body>
  <p>Redirecting...</p>
  ${
    processedDcmUrl
      ? `<img src="${processedDcmUrl}" width="1" height="1" style="display:none" alt="" />`
      : ""
  }
</body>
</html>`;
}

// Public redirect endpoint
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const qrCode = await qrcodeService.getQRCodeBySlug(slug);

    if (!qrCode) {
      return res.status(404).send("QR code not found");
    }

    // Record the scan (non-blocking)
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "";
    statsService
      .recordScan({
        qrCodeId: qrCode.id,
        userAgent: req.headers["user-agent"] || "",
        referrer: req.headers.referer,
        ip,
      })
      .catch((err) => console.error("Error recording scan:", err));

    // Build final URL with UTM parameters
    const finalUrl = buildFinalUrl(qrCode.destination_url, {
      utm_source: qrCode.utm_source,
      utm_medium: qrCode.utm_medium,
      utm_campaign: qrCode.utm_campaign,
      utm_term: qrCode.utm_term,
      utm_content: qrCode.utm_content,
    });

    // If DCM tracking is configured, serve HTML page with tracking pixel
    if (qrCode.dcm_impression_tag) {
      const trackingPage = generateTrackingPage(
        qrCode.dcm_impression_tag,
        finalUrl
      );
      res.setHeader("Content-Type", "text/html");
      res.send(trackingPage);
    } else {
      // No DCM tracking - simple redirect
      res.redirect(302, finalUrl);
    }
  } catch (error: any) {
    console.error("Redirect error:", error);
    res.status(500).send("Internal server error");
  }
});

export default router;
