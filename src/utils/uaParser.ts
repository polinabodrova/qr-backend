import { UAParser } from "ua-parser-js";

export interface ParsedUserAgent {
  deviceType: string;
  browser: string;
}

export function parseUserAgent(userAgentString: string): ParsedUserAgent {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  let deviceType = "desktop";
  if (result.device.type === "mobile") {
    deviceType = "mobile";
  } else if (result.device.type === "tablet") {
    deviceType = "tablet";
  }

  const browser = result.browser.name || "Unknown";

  return { deviceType, browser };
}
