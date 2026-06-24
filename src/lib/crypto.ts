import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * Returns a string formatted as "salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hashed = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hashed, "hex"));
  } catch {
    return false;
  }
}
