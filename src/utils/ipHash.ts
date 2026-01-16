import crypto from "crypto";

const SALT = process.env.IP_SALT || "qr-app-salt-change-in-production";

export function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + SALT)
    .digest("hex");
}
