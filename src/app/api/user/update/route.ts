import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';

// 更新用户验证模式
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证用户身份
    const authenticatedUser = await verifyUserInApiRoute(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
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
      successResponse(updatedUser, 'User updated successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}