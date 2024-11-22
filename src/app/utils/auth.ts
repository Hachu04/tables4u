import bcrypt from "bcryptjs";

/**
 * Hash a plain-text password
 * @param plainPassword - The plain-text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10; // Number of hashing rounds
  return await bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Verify a plain-text password against a hashed password
 * @param plainPassword - The plain-text password to check
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to true if passwords match, false otherwise
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}