import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyAdminInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const adminUser = await verifyAdminInApiRoute(request);
    
    if (!adminUser) {
      return NextResponse.json(
        errorResponse('Forbidden: Admin access required'),
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }
    
    // 获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // 获取用户列表
    const users = await db.query.user.findMany({
      limit,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 获取用户总数
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(user);
    const total = totalUsers[0].count;

    return NextResponse.json(
      successResponse({
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }, 'Users retrieved successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}