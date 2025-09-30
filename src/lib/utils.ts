import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 生成唯一ID
export function generateId(): string {
  return randomUUID();
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 成功响应
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// 错误响应
export function errorResponse(error: string, statusCode?: number): ApiResponse {
  return {
    success: false,
    error,
  };
}

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

import { type NextRequest } from 'next/server';
import { fallbackLng, languages } from '../i18n/settings';
type Locale = typeof languages[0];

export function getLanguageFromNextRequest(request: NextRequest): string {
  // 优先使用 URL 查询参数中的 'lang'
  const langParam = request.nextUrl.searchParams.get('lang');
  if (langParam && languages.includes(langParam as Locale)) {
    return langParam;
  }

  // 否则，尝试从 'Accept-Language' 请求头中获取
  const acceptLanguage = request.headers.get('x-next-locale');
  if (acceptLanguage) {
    const detectedLng = acceptLanguage
      .split(',')
      .map(l => l.split(';')[0])
      .find(l => languages.includes(l as Locale));
    if (detectedLng) {
      return detectedLng;
    }
  }
  // console.log('fallback to default: '+fallbackLng)
  // 如果未找到支持的语言，则返回默认语言
  return fallbackLng;
}


import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import path from 'path';

/**
 * 从请求头和参数中获取真实的路径
 */
export async function getTruePathFromHeaders(headersList: ReadonlyHeaders, langParam: string, isRoot: boolean = false): Promise<string> {
  const pathname = headersList.get('x-next-pathname') || '';
  // console.log('Current pathname (from server):', pathname);
  // console.log('langParam:', langParam);
  if (pathname === '' || !languages.includes(pathname as Locale)) {
    if (isRoot) {
      return '/';
    }
    return '';
  }
  return pathname !== langParam ? "/" : "/"+langParam;
}

/**
 * 根据 pathname 和初始语言获取正确的语言路径
 */
export function getTruePathFromPathname(pathname: string, initialLang: string): string {
  const rootPathname = pathname.split('/')[1];
  // console.log('rootPathname:', rootPathname);
  // 处理根路径
  if (pathname === '/' || !languages.includes(rootPathname as Locale)) {
    return '';
  }
  // 处理其他路径
  return pathname === '/' ? '/' : '/'+initialLang;
}
