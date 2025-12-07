/**
 * Script to generate password hash for admin panel
 * 
 * Usage:
 *   node generate-password-hash.js "your-password"
 * 
 * This script generates a SHA-256 hash of your password for use in
 * REACT_APP_ADMIN_PASSWORD_HASH environment variable.
 * 
 * Security: This script does NOT store or transmit your password.
 * It only generates a hash locally on your machine.
 */

const crypto = require('crypto');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('\n❌ Error: Password required\n');
  console.log('Usage: node generate-password-hash.js "your-password"\n');
  console.log('Example: node generate-password-hash.js "mySecurePassword123"\n');
  process.exit(1);
}

// Generate SHA-256 hash
const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n🔐 Password Hash Generator\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\n📋 Add this to your .env file:');
console.log(`REACT_APP_ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('Or add it to Vercel environment variables:\n');
console.log(`REACT_APP_ADMIN_PASSWORD_HASH = ${hash}\n`);

