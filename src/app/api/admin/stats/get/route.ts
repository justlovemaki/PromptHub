import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyAdminInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { user, prompt, space } from '@/drizzle-schema';
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
    
    // 获取统计数据
    const [
      totalUsersResult,
      totalPromptsResult,
      totalSpacesResult,
      subscriptionStatsResult,
    ] = await Promise.all([
      // 总用户数
      db.select({ count: sql<number>`count(*)` }).from(user),
      
      // 总提示词数
      db.select({ count: sql<number>`count(*)` }).from(prompt),
      
      // 总空间数
      db.select({ count: sql<number>`count(*)` }).from(space),
      
      // 订阅状态统计
      db.select({
        subscriptionStatus: user.subscriptionStatus,
        count: sql<number>`count(*)`
      })
      .from(user)
      .groupBy(user.subscriptionStatus),
    ]);

    // 本月新用户
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonthResult = await db.select({ count: sql<number>`count(*)` })
      .from(user)
      .where(sql`${user.createdAt} >= ${thisMonth.getTime()}`);

    // 格式化订阅统计
    const subscriptionStats = {
      free: 0,
      pro: 0,
      team: 0,
    };

    subscriptionStatsResult.forEach(stat => {
      if (stat.subscriptionStatus in subscriptionStats) {
        subscriptionStats[stat.subscriptionStatus as keyof typeof subscriptionStats] = stat.count;
      }
    });

    const stats = {
      totalUsers: totalUsersResult[0].count,
      totalPrompts: totalPromptsResult[0].count,
      totalSpaces: totalSpacesResult[0].count,
      activeUsers: totalUsersResult[0].count, // 简化版，实际可以按最近登录时间统计
      newUsersThisMonth: newUsersThisMonthResult[0].count,
      subscriptionStats,
    };

    return NextResponse.json(
      successResponse(stats, 'Platform statistics retrieved successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}