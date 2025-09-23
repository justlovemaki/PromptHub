import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { aiPointTransaction, user } from '@/drizzle-schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    
    // 获取查询参数
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const type = url.searchParams.get('type') || 'USE';
    
    // 计算日期范围
    const now = new Date();
    const monthStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // 构建查询条件
    const conditions = [
      eq(aiPointTransaction.userId, authenticatedUser.id),
      gte(aiPointTransaction.createdAt, monthStart),
      lte(aiPointTransaction.createdAt, monthEnd)
    ];
    
    // 如果提供了type参数，则添加对type字段的过滤条件
    if (type && (type === 'EARN' || type === 'USE' || type === 'ADMIN')) {
      conditions.push(
        eq(aiPointTransaction.type, type as 'EARN' | 'USE' | 'ADMIN')
      );
    }
    
    // 查询用户本月的AI点数流水记录
    const usageRecords = await db
      .select({
        id: aiPointTransaction.id,
        userId: aiPointTransaction.userId,
        amount: aiPointTransaction.amount,
        balance: aiPointTransaction.balance,
        type: aiPointTransaction.type,
        description: aiPointTransaction.description,
        relatedId: aiPointTransaction.relatedId,
        createdAt: aiPointTransaction.createdAt,
      })
      .from(aiPointTransaction)
      .where(and(...conditions))
      .orderBy(aiPointTransaction.createdAt);
    
    // 计算总使用点数（只统计类型为"USE"的记录，且amount为负数）
    const totalUsedPoints = usageRecords
      .filter(record => record.type === 'USE' && record.amount < 0)
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    // 获取用户的订阅信息以获取总点数
    const userDetails = await db
      .select({
        subscriptionStatus: user.subscriptionStatus,
        subscriptionAiPoints: user.subscriptionAiPoints,
      })
      .from(user)
      .where(eq(user.id, authenticatedUser.id))
      .limit(1);
    
    const userInfo = userDetails[0];
    
    // 使用数据库中的subscriptionAiPoints作为总点数
    let totalPoints = userInfo?.subscriptionAiPoints || 0;
    
    // 计算剩余点数
    const remainingPoints = Math.max(0, totalPoints - totalUsedPoints);
    
    return NextResponse.json(
      successResponse({
        totalPoints,
        usedPoints: totalUsedPoints,
        remainingPoints,
        usageRecords,
      }, t('success.aiPointsRetrieved'))
    );
    
  } catch (error) {
    console.error('获取AI点数使用情况失败:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}