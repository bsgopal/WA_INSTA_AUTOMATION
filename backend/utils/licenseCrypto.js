const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

const buildKey = () => crypto.scryptSync(
  process.env.LICENSE_SECRET || 'RenicSoft_Enterprise_Level_License_Secure_Key_2026',
  process.env.LICENSE_SALT || 'RenicSoft_Salt_2026',
  32
);

const SECRET_KEY = buildKey();

/**
 * Decrypt a license key string to extract the original payload.
 */
function decryptLicense(encryptedText) {
  const parts = encryptedText.trim().split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid or corrupted license key format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

module.exports = {
  decryptLicense
};
