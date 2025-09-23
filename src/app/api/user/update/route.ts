import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { getTranslation } from '@/i18n';

export async function POST(request: NextRequest) {
  // 获取语言设置
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  // 更新用户验证模式
  const updateUserSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')).optional(),
  });

  try {
    const body = await request.json();
    
    // 验证用户身份
    const authenticatedUser = await verifyUserInApiRoute(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 验证请求数据
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidInput') + ': ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    
    const { name } = validation.data;
     
    // 更新用户
    const [updatedUser] = await db.update(user)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(user.id, authenticatedUser.id))
      .returning();
    
    delete updatedUser.role;
    delete updatedUser.stripeCustomerId;
    delete updatedUser.subscriptionId;
    delete updatedUser.subscriptionStatus;
    delete updatedUser.subscriptionEndDate;
    return NextResponse.json(
      successResponse(updatedUser, t('success.userUpdated')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}