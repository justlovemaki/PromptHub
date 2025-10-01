import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { accessTokens } from '@/drizzle-schema';
import { eq, and } from 'drizzle-orm';
import { verifyUserInApiRoute, type AuthenticatedUser } from '@/lib/auth-helpers';
import { generateId } from '@/lib/utils';

interface AccessTokenResponse {
  token: string;
  refreshToken?: string;
  expiresAt: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string;
}

// 获取用户的访问令牌
export const GET = async (request: NextRequest) => {
  try {
    // 验证用户身份
    const authUser = await verifyUserInApiRoute(request);
    if (!authUser) {
      return Response.json({
        success: false,
        error: { message: '未授权访问' }
      }, { status: 401 });
    }

    // 查找用户的访问令牌记录
    const tokenRecord = await db.query.accessTokens.findFirst({
      where: eq(accessTokens.userId, authUser.id)
    });

    if (!tokenRecord) {
      return Response.json({
        success: true,
        data: {
          token: null,
          refreshToken: null,
          expiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null
        }
      });
    }

    return Response.json({
      success: true,
      data: {
        token: tokenRecord.accessToken,
        refreshToken: tokenRecord.refreshToken,
        expiresAt: tokenRecord.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokenRecord.refreshTokenExpiresAt,
        scope: tokenRecord.scope
      }
    });
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    return Response.json({
      success: false,
      error: { message: '获取访问令牌失败' }
    }, { status: 500 });
  }
};

// 刷新访问令牌
export const POST = async (request: NextRequest) => {
  try {
    // 从请求体获取参数
    const { refreshToken, expiresIn, refreshExpiresIn } = await request.json();

    // 如果提供了refreshToken，则尝试刷新现有令牌
    if (refreshToken) {
      // 根据refreshToken查找令牌记录
      const tokenRecord = await db.query.accessTokens.findFirst({
        where: eq(accessTokens.refreshToken, refreshToken)
      });

      if (!tokenRecord) {
        return Response.json({
          success: false,
          error: { message: '无效的refreshToken' }
        }, { status: 401 });
      }

      // 检查refreshToken是否已过期
      if (tokenRecord.refreshTokenExpiresAt && new Date() > tokenRecord.refreshTokenExpiresAt) {
        return Response.json({
          success: false,
          error: { message: 'refreshToken已过期' }
        }, { status: 401 });
      }

      // 生成新的访问令牌
      const newToken = `lsp_${generateId()}`;
      const newRefreshToken = `lspg_${generateId()}`;
      
      // 计算过期时间
      let accessTokenExpiresAt: Date | null = null;
      let refreshTokenExpiresAt: Date | null = null;
      
      if (expiresIn && typeof expiresIn === 'number') {
        accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000); // expiresIn 是秒数
      }
      
      if (refreshExpiresIn && typeof refreshExpiresIn === 'number') {
        refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000); // refreshExpiresIn 是秒数
      }

      // 更新令牌记录
      await db.update(accessTokens)
        .set({
          accessToken: newToken,
          refreshToken: newRefreshToken,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          updatedAt: new Date()
        })
        .where(eq(accessTokens.id, tokenRecord.id));

      return Response.json({
        success: true,
        data: {
          token: newToken,
          expiresAt: accessTokenExpiresAt,
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt,
          scope: tokenRecord.scope
        }
      });
    } else {
      // 没有提供refreshToken，验证用户身份
      const authUser = await verifyUserInApiRoute(request);
      if (!authUser) {
        return Response.json({
          success: false,
          error: { message: '未授权访问' }
        }, { status: 401 });
      }

      // 检查是否已存在该用户的令牌记录
      const existingTokenRecord = await db.query.accessTokens.findFirst({
        where: eq(accessTokens.userId, authUser.id)
      });

      // 如果存在令牌记录但没有提供refreshToken，需要拦截请求，要求提供refreshToken
      if (existingTokenRecord) {
        return Response.json({
          success: false,
          error: { message: '需要提供refreshToken来刷新访问令牌' }
        }, { status: 400 });
      }

      // 生成新的访问令牌
      const newToken = `lsp_${generateId()}`;
      const newRefreshToken = `lspg_${generateId()}`;
      
      // 计算过期时间
      let accessTokenExpiresAt: Date | null = null;
      let refreshTokenExpiresAt: Date | null = null;
      
      if (expiresIn && typeof expiresIn === 'number') {
        accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000); // expiresIn 是秒数
      }
      
      if (refreshExpiresIn && typeof refreshExpiresIn === 'number') {
        refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000); // refreshExpiresIn 是秒数
      }

      // 创建新记录
      const newTokenRecord = await db.insert(accessTokens)
        .values({
          id: generateId(),
          userId: authUser.id,
          accessToken: newToken,
          refreshToken: newRefreshToken,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          scope: null, // 可以根据需要设置scope
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return Response.json({
        success: true,
        data: {
          token: newToken,
          expiresAt: accessTokenExpiresAt,
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt,
          scope: newTokenRecord[0].scope
        }
      });
    }
  } catch (error) {
    console.error('刷新访问令牌失败:', error);
    return Response.json({
      success: false,
      error: { message: '刷新访问令牌失败' }
    }, { status: 500 });
  }
};

// 删除访问令牌
export const DELETE = async (request: NextRequest) => {
  try {
    // 验证用户身份
    const authUser = await verifyUserInApiRoute(request);
    if (!authUser) {
      return Response.json({
        success: false,
        error: { message: '未授权访问' }
      }, { status: 401 });
    }

    // 删除用户的访问令牌记录
    await db.delete(accessTokens)
      .where(eq(accessTokens.userId, authUser.id));

    return Response.json({
      success: true,
      message: '访问令牌已删除'
    });
  } catch (error) {
    console.error('删除访问令牌失败:', error);
    return Response.json({
      success: false,
      error: { message: '删除访问令牌失败' }
    }, { status: 500 });
  }
};