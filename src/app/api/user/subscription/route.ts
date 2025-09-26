import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    // 验证用户身份
    const authenticatedUser = await verifyUserInApiRoute(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const { action } = body; // 'upgrade', 'downgrade', 'cancel'
    
    // 验证操作类型
    if (!action || !['upgrade', 'downgrade', 'cancel'].includes(action)) {
      return NextResponse.json(
        errorResponse(t('validation.invalidActionType')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    
    let updatedUser;
    
    // 根据操作类型更新订阅状态
    switch (action) {
      case 'upgrade':
        // 升级到专业版
        [updatedUser] = await db.update(user)
          .set({
            subscriptionStatus: 'PRO',
            subscriptionAiPoints: 5000, // 重置AI点数
            updatedAt: new Date(),
          })
          .where(eq(user.id, authenticatedUser.id))
          .returning();
        break;
        
      case 'downgrade':
        // 降级到免费版
        [updatedUser] = await db.update(user)
          .set({
            subscriptionStatus: 'FREE',
            subscriptionAiPoints: 1000, // 重置AI点数
            subscriptionId: null,
            subscriptionEndDate: null,
            updatedAt: new Date(),
          })
          .where(eq(user.id, authenticatedUser.id))
          .returning();
        break;
        
      case 'cancel':
        // 取消订阅
        [updatedUser] = await db.update(user)
          .set({
            subscriptionStatus: 'FREE',
            subscriptionAiPoints: 0, // 重置AI点数
            subscriptionId: null,
            subscriptionEndDate: null,
            updatedAt: new Date(),
          })
          .where(eq(user.id, authenticatedUser.id))
          .returning();
        break;
        
      default:
        return NextResponse.json(
          errorResponse(t('validation.invalidActionType')),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
    }
    
    return NextResponse.json(
      successResponse({
        userId: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
      }, t('success.subscriptionUpdated'))
    );
    
  } catch (error) {
    console.error('更新订阅状态失败:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}