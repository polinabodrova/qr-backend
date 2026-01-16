import { sql } from "../db/database";
import { parseUserAgent } from "../utils/uaParser";
import { hashIp } from "../utils/ipHash";

export interface ScanEventInput {
  qrCodeId: number;
  userAgent: string;
  referrer?: string;
  ip: string;
}

export async function recordScan(input: ScanEventInput): Promise<void> {
  const { deviceType, browser } = parseUserAgent(input.userAgent);
  const ipHash = hashIp(input.ip);

  await sql`
    INSERT INTO scan_events (qr_code_id, user_agent, referrer, ip_hash, device_type, browser)
    VALUES (${input.qrCodeId}, ${input.userAgent}, ${
    input.referrer || null
  }, ${ipHash}, ${deviceType}, ${browser})
  `;
}

export interface StatsData {
  totalScans: number;
  uniqueScans: number;
  dailySeries: Array<{ date: string; scans: number; unique_scans: number }>;
  topCountries: Array<{ country: string; scans: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
}

export async function getQRCodeStats(
  qrCodeId: number,
  startDate?: string,
  endDate?: string
): Promise<StatsData> {
  // Total scans
  const totalResult =
    startDate && endDate
      ? await sql`
        SELECT COUNT(*) as total
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId} AND DATE(scanned_at) BETWEEN ${startDate} AND ${endDate}
      `
      : await sql`
        SELECT COUNT(*) as total
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId}
      `;
  const totalScans = Number(totalResult[0].total);

  // Unique scans (by IP hash)
  const uniqueResult =
    startDate && endDate
      ? await sql`
        SELECT COUNT(DISTINCT ip_hash) as unique_count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId} AND DATE(scanned_at) BETWEEN ${startDate} AND ${endDate}
      `
      : await sql`
        SELECT COUNT(DISTINCT ip_hash) as unique_count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId}
      `;
  const uniqueScans = Number(uniqueResult[0].unique_count);

  // Daily series
  const dailyResults =
    startDate && endDate
      ? await sql`
        SELECT 
          DATE(scanned_at) as date,
          COUNT(*) as scans,
          COUNT(DISTINCT ip_hash) as unique_scans
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId} AND DATE(scanned_at) BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(scanned_at)
        ORDER BY date DESC
        LIMIT 30
      `
      : await sql`
        SELECT 
          DATE(scanned_at) as date,
          COUNT(*) as scans,
          COUNT(DISTINCT ip_hash) as unique_scans
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId}
        GROUP BY DATE(scanned_at)
        ORDER BY date DESC
        LIMIT 30
      `;
  const dailySeries = dailyResults.reverse().map((row: any) => ({
    date: row.date,
    scans: Number(row.scans),
    unique_scans: Number(row.unique_scans),
  }));

  // Device breakdown
  const deviceResults =
    startDate && endDate
      ? await sql`
        SELECT device_type, COUNT(*) as count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId} AND DATE(scanned_at) BETWEEN ${startDate} AND ${endDate}
        GROUP BY device_type
      `
      : await sql`
        SELECT device_type, COUNT(*) as count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId}
        GROUP BY device_type
      `;

  const deviceBreakdown: Record<string, number> = {};
  deviceResults.forEach((row: any) => {
    deviceBreakdown[row.device_type] = Number(row.count);
  });

  // Browser breakdown
  const browserResults =
    startDate && endDate
      ? await sql`
        SELECT browser, COUNT(*) as count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId} AND DATE(scanned_at) BETWEEN ${startDate} AND ${endDate}
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
      `
      : await sql`
        SELECT browser, COUNT(*) as count
        FROM scan_events
        WHERE qr_code_id = ${qrCodeId}
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 10
      `;

  const browserBreakdown: Record<string, number> = {};
  browserResults.forEach((row: any) => {
    browserBreakdown[row.browser] = Number(row.count);
  });

  // Top countries (placeholder - would need GeoIP)
  const topCountries: Array<{ country: string; scans: number }> = [];

  return {
    totalScans,
    uniqueScans,
    dailySeries,
    topCountries,
    deviceBreakdown,
    browserBreakdown,
  };
}
