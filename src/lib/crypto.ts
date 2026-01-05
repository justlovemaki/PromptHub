/**
 * 简单的数据加密/解密工具
 * 用于防止爬虫直接获取 API 返回的明文数据
 * 注意：这不是安全加密，只是增加爬虫的难度
 */

// 加密密钥（可以从环境变量获取）
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'pm_2024_secure_key';

/**
 * 简单的 XOR 加密
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * 将字符串转换为 Base64
 */
function toBase64(str: string): string {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    return btoa(unescape(encodeURIComponent(str)));
  } else {
    // Node.js 环境
    return Buffer.from(str, 'utf-8').toString('base64');
  }
}

/**
 * 将 Base64 转换为字符串
 */
function fromBase64(base64: string): string {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    return decodeURIComponent(escape(atob(base64)));
  } else {
    // Node.js 环境
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}

/**
 * 加密数据（服务端使用）
 * @param data 要加密的数据对象
 * @returns 加密后的字符串
 */
export function encryptData<T>(data: T): string {
  try {
    const jsonStr = JSON.stringify(data);
    // 添加时间戳和随机数增加混淆
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const payload = `${timestamp}:${random}:${jsonStr}`;
    
    // XOR 加密
    const encrypted = xorEncrypt(payload, ENCRYPTION_KEY);
    
    // Base64 编码
    return toBase64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密数据（客户端使用）
 * @param encryptedStr 加密的字符串
 * @returns 解密后的数据对象
 */
export function decryptData<T>(encryptedStr: string): T {
  try {
    // Base64 解码
    const decoded = fromBase64(encryptedStr);
    
    // XOR 解密
    const decrypted = xorEncrypt(decoded, ENCRYPTION_KEY);
    
    // 解析 payload（格式：timestamp:random:jsonStr）
    const parts = decrypted.split(':');
    if (parts.length < 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    // 提取 JSON 字符串（可能包含冒号，所以需要重新拼接）
    const jsonStr = parts.slice(2).join(':');
    
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * 检查响应是否为加密格式
 */
export function isEncryptedResponse(response: unknown): response is { encrypted: true; data: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'encrypted' in response &&
    (response as { encrypted: boolean }).encrypted === true &&
    'data' in response &&
    typeof (response as { data: unknown }).data === 'string'
  );
}