/**
 * Password hashing utility using Web Crypto API
 * Uses SHA-256 for secure password hashing
 */

/**
 * Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password as hex string
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to compare against
 * @returns {Promise<boolean>} - True if password matches hash
 */
export const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * Get the stored admin password hash from environment or default
 * In production, this should be set via REACT_APP_ADMIN_PASSWORD_HASH
 * Default hash is for password: "admin123" (change this!)
 */
export const getAdminPasswordHash = () => {
  // In production, use environment variable
  // For now, using a default hash (password: "admin123")
  // IMPORTANT: Change this default password in production!
  const envHash = process.env.REACT_APP_ADMIN_PASSWORD_HASH;
  if (envHash) {
    return envHash;
  }
  
  // Default hash for "admin123" - CHANGE THIS IN PRODUCTION!
  // To generate a new hash, use: await hashPassword("your-password")
  return "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
};

