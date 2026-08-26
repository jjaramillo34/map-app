/**
 * Generate a SHA-256 password hash for admin login.
 *
 * Usage:
 *   node generate-password-hash.js "your-password"
 *
 * Then put the hash in .env / Vercel as ADMIN_PASSWORD_HASH.
 * Also set ADMIN_USERNAME and ADMIN_SESSION_SECRET on the server.
 */

const crypto = require("crypto");

const password = process.argv[2];

if (!password) {
  console.error("\nError: Password required\n");
  console.log('Usage: node generate-password-hash.js "your-password"\n');
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(password).digest("hex");
const sessionSecret = crypto.randomBytes(32).toString("hex");

console.log("\nAdmin credentials\n");
console.log("Hash:", hash);
console.log("\nAdd these server environment variables:");
console.log("ADMIN_USERNAME=your-username");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}\n`);
