/**
 * 数据加密工具
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * 生成加密密钥
 */
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * 从密码生成密钥
 */
export function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * 加密数据
 */
export function encrypt(text, key) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('chatbot-data', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * 解密数据
 */
export function decrypt(encryptedData, key) {
  try {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('chatbot-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * 哈希密码
 */
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * 生成随机盐
 */
export function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 验证密码
 */
export function verifyPassword(password, hash, salt) {
  const hashedPassword = hashPassword(password, salt);
  return hashedPassword === hash;
}

/**
 * 生成安全令牌
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 计算数据哈希
 */
export function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
