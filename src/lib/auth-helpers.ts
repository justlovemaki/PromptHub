// API 路由中的认证助手函数
// 使用标准 Node.js 环境的数据库连接
import { UserService } from './services';
import { NextRequest } from 'next/server';
import { db } from './database';
import { session } from '../drizzle-schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { USER_ROLES } from './constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: typeof USER_ROLES.USER | typeof USER_ROLES.ADMIN;
  personalSpaceId: string;
}

/**
 * 在 API 路由中验证用户身份
 * 这个函数在 Node.js 环境中运行，可以安全使用数据库
 */
export async function verifyUserInApiRoute(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // 从请求头获取token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }
    
    // 提取token（支持Bearer token格式）
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader;
    
    // 通过token查询session表获取userId
    const sessionRecord = await db.query.session.findFirst({
      where: eq(session.token, token),
    });
    
    if (!sessionRecord || !sessionRecord.userId) {
      return null;
    }
    
    // 检查session是否过期
    if (sessionRecord.expiresAt < new Date()) {
      return null;
    }
    
    // 从数据库获取完整的用户信息（包括role）
    const user = await UserService.findUserById(sessionRecord.userId);
    if (!user) {
      return null;
    }
    
    // 获取用户的个人空间
    const personalSpace = await UserService.getUserPersonalSpace(user.id);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      personalSpaceId: personalSpace?.id || "0x0000000000000000000000000000000000000000",
    };
  } catch (error) {
    console.error('User verification error:', error);
    return null;
  }
}

/**
 * 检查用户是否为管理员
 */
export async function verifyAdminInApiRoute(request: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await verifyUserInApiRoute(request);
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return null;
  }
  return user;
}

/**
 * 从请求头中获取用户 ID（如果中间件已经验证过）
 */
export function getUserIdFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * 从请求头中获取用户角色（如果中间件已经验证过）
 */
export function getUserRoleFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-role');
}

/**
 * 检查是否需要管理员权限
 */
export function requiresAdminFromHeaders(request: NextRequest): boolean {
  return request.headers.get('x-require-admin') === 'true';
}