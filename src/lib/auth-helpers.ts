// API 路由中的认证助手函数
// 使用标准 Node.js 环境的数据库连接
import { UserService } from './services';
import { NextRequest } from 'next/server';
import { db } from './database';
import { session } from '../drizzle-schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { USER_ROLES } from './constants';
import { authenticateRequest } from './mcp-auth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: typeof USER_ROLES.USER | typeof USER_ROLES.ADMIN;
  personalSpaceId: string;
}

// 缓存配置 - 存储验证结果，10分钟过期
const userCache = new Map<string, { value: AuthenticatedUser | null; expiresAt: number }>();

const CACHE_TTL = 10 * 60 * 1000; // 10分钟，以毫秒为单位

/**
 * 提取 Bearer Token 并验证
 */
async function verifyBearerToken(authHeader: string) {
  // 提取token（支持Bearer token格式）
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  // 检查缓存
  const cachedResult = userCache.get(token);
  if (cachedResult && Date.now() < cachedResult.expiresAt) {
    // 如果缓存存在且未过期，直接返回缓存的结果
    return cachedResult.value;
  }

  // 缓存未命中或已过期，执行数据库查询
  // 通过token查询session表获取userId
  const sessionRecord = await db.query.session.findFirst({
    where: eq(session.token, token),
  });

  if (!sessionRecord || !sessionRecord.userId) {
    // 不缓存null结果，直接返回
    return null;
  }

  // 检查session是否过期
  if (sessionRecord.expiresAt < new Date()) {
    // 不缓存null结果，直接返回
    return null;
  }

  // 从数据库获取完整的用户信息（包括role）
  const user = await UserService.findUserById(sessionRecord.userId);
  if (!user) {
    // 不缓存null结果，直接返回
    return null;
  }

  // 获取用户的个人空间
  const personalSpace = await UserService.getUserPersonalSpace(user.id);

  const result: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    personalSpaceId: personalSpace?.id || "0x0000000000000000000000000000000000000000",
  };

  // 只缓存非null的返回值
  userCache.set(token, {
    value: result,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return result;
}

/**
 * 在 API 路由中验证用户身份
 * 这个函数在 Node.js 环境中运行，可以安全使用数据库
 * 支持 Bearer token 和 Token (MCP) 两种格式
 */
export async function verifyUserInApiRoute(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // 从请求头获取token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    // 根据token类型选择不同的验证逻辑 - 非此即彼
    if (authHeader.startsWith('Token ')) {
      // Token 格式 - 调用 MCP 认证
      const token = authHeader.substring(6); // 移除 "Token " 前缀
      
      // 检查缓存 - 使用同样的缓存机制
      const cachedResult = userCache.get(token);
      if (cachedResult && Date.now() < cachedResult.expiresAt) {
        return cachedResult.value;
      }

      // 调用 MCP 认证逻辑
      const result = await authenticateRequest(request);
      
      // 只缓存非null的返回值
      if (result) {
        userCache.set(token, {
          value: result,
          expiresAt: Date.now() + CACHE_TTL,
        });
      }
      
      return result;
    } else {
      // Bearer 格式 - 使用原有逻辑
      return await verifyBearerToken(authHeader);
    }
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