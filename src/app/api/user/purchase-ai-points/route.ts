import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { user, aiPointTransaction } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import { getTranslation } from '@/i18n';
import { AI_POINTS_PACKAGES } from '@/lib/constants';

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
    const { packageType } = body; // 'small', 'medium', 'large'
    
    // 验证套餐类型
    if (!packageType || !AI_POINTS_PACKAGES[packageType]) {
      return NextResponse.json(
        errorResponse(t('validation.invalidPackageType')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    
    const packageInfo = AI_POINTS_PACKAGES[packageType];
    
    // 获取用户的完整信息
    const userDetails = await db.query.user.findFirst({
      where: eq(user.id, authenticatedUser.id),
    });
    
    if (!userDetails) {
      return NextResponse.json(
        errorResponse(t('error.userNotFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
    
    // 更新用户AI点数
    const [updatedUser] = await db.update(user)
      .set({
        subscriptionAiPoints: userDetails.subscriptionAiPoints + packageInfo.points,
        updatedAt: new Date(),
      })
      .where(eq(user.id, authenticatedUser.id))
      .returning({
        id: user.id,
        subscriptionAiPoints: user.subscriptionAiPoints,
      });
    
    // 记录AI点数交易流水
    await db.insert(aiPointTransaction).values({
      id: generateId(),
      userId: authenticatedUser.id,
      amount: packageInfo.points,
      balance: updatedUser.subscriptionAiPoints,
      type: 'EARN',
      description: t('transaction.purchaseAiPoints', { packageType }),
      relatedId: null,
      createdAt: new Date(),
    });
    
    return NextResponse.json(
      successResponse({
        userId: updatedUser.id,
        newBalance: updatedUser.subscriptionAiPoints,
        purchasedPoints: packageInfo.points,
      }, t('success.aiPointsPurchased'))
    );
    
  } catch (error) {
    console.error('购买AI点数失败:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}