import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyAdminInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { getTranslation } from '@/i18n';

// 更新用户验证模式
const updateUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionStatus: z.enum(['FREE', 'PRO', 'TEAM']).optional(),
  subscriptionEndDate: z.date().nullable().optional(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // 获取语言设置
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'admin');

  try {
    const body = await request.json();

    // 验证管理员身份
    const adminUser = await verifyAdminInApiRoute(request);

    if (!adminUser) {
      return NextResponse.json(
        errorResponse(t('error.forbidden')),
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }
    
    // 验证请求数据
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { userId, role, subscriptionStatus, subscriptionEndDate, name } = validation.data;

    // 检查目标用户是否存在
    const targetUser = await UserService.findUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        errorResponse(t('error.notFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 更新用户
    const [updatedUser] = await db.update(user)
      .set({
        ...(role !== undefined && { role }),
        ...(subscriptionStatus !== undefined && { subscriptionStatus }),
        ...(subscriptionEndDate !== undefined && { subscriptionEndDate }),
        ...(name !== undefined && { name }),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        updatedAt: user.updatedAt,
      });

    return NextResponse.json(
      successResponse(updatedUser, t('success.operationCompleted')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}