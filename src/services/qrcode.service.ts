import QRCode from "qrcode";
import { sql } from "../db/database";
import { generateSlug } from "../utils/slugGenerator";
import { isValidUrl } from "./url.service";

export interface QRCodeData {
  id: number;
  slug: string;
  name?: string;
  destination_url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  dcm_impression_tag?: string;
  created_at: string;
  archived_at?: string;
}

export interface CreateQRCodeInput {
  name?: string;
  destination_url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  dcm_impression_tag?: string;
}

export async function createQRCode(
  input: CreateQRCodeInput
): Promise<QRCodeData> {
  if (!isValidUrl(input.destination_url)) {
    throw new Error(
      "Invalid URL: Only http:// and https:// protocols are allowed"
    );
  }

  const slug = generateSlug();

  const result = await sql`
    INSERT INTO qr_codes (slug, name, destination_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, dcm_impression_tag)
    VALUES (${slug}, ${input.name || null}, ${input.destination_url}, ${
    input.utm_source || null
  }, ${input.utm_medium || null}, ${input.utm_campaign || null}, ${
    input.utm_term || null
  }, ${input.utm_content || null}, ${input.dcm_impression_tag || null})
    RETURNING *
  `;

  return result[0] as QRCodeData;
}

export async function getQRCodeById(
  id: number
): Promise<QRCodeData | undefined> {
  const result = await sql`
    SELECT * FROM qr_codes WHERE id = ${id} AND archived_at IS NULL
  `;
  return result[0] as QRCodeData | undefined;
}

export async function getQRCodeBySlug(
  slug: string
): Promise<QRCodeData | undefined> {
  const result = await sql`
    SELECT * FROM qr_codes WHERE slug = ${slug} AND archived_at IS NULL
  `;
  return result[0] as QRCodeData | undefined;
}

export async function getAllQRCodes(): Promise<QRCodeData[]> {
  const result = await sql`
    SELECT * FROM qr_codes WHERE archived_at IS NULL ORDER BY created_at DESC
  `;
  return result as QRCodeData[];
}

export async function updateQRCode(
  id: number,
  input: Partial<CreateQRCodeInput>
): Promise<QRCodeData | undefined> {
  if (input.destination_url && !isValidUrl(input.destination_url)) {
    throw new Error(
      "Invalid URL: Only http:// and https:// protocols are allowed"
    );
  }

  if (Object.keys(input).length === 0) {
    return getQRCodeById(id);
  }

  // Build dynamic update query
  const updateFields: Record<string, any> = {};

  if (input.name !== undefined) updateFields.name = input.name || null;
  if (input.destination_url !== undefined)
    updateFields.destination_url = input.destination_url;
  if (input.utm_source !== undefined)
    updateFields.utm_source = input.utm_source || null;
  if (input.utm_medium !== undefined)
    updateFields.utm_medium = input.utm_medium || null;
  if (input.utm_campaign !== undefined)
    updateFields.utm_campaign = input.utm_campaign || null;
  if (input.utm_term !== undefined)
    updateFields.utm_term = input.utm_term || null;
  if (input.utm_content !== undefined)
    updateFields.utm_content = input.utm_content || null;
  if (input.dcm_impression_tag !== undefined)
    updateFields.dcm_impression_tag = input.dcm_impression_tag || null;

  const setClauses = Object.keys(updateFields)
    .map((key, idx) => `${key} = $${idx + 1}`)
    .join(", ");
  const values = Object.values(updateFields);
  values.push(id);

  // Using raw SQL with parameterized values
  const query = `UPDATE qr_codes SET ${setClauses} WHERE id = $${values.length} AND archived_at IS NULL RETURNING *`;
  const result = await sql([query] as any, values);

  return result[0] as QRCodeData | undefined;
}

export async function deleteQRCode(id: number): Promise<boolean> {
  const result = await sql`
    UPDATE qr_codes SET archived_at = CURRENT_TIMESTAMP 
    WHERE id = ${id} AND archived_at IS NULL
    RETURNING id
  `;
  return result.length > 0;
}

export async function generateQRCodeImage(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 1,
    width: 512,
  });
}
