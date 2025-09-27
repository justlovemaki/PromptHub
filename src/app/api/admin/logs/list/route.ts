import { NextRequest, NextResponse } from 'next/server';
import { systemLogs } from '@/drizzle-schema';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyAdminInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { asc, desc, like, and, or, gte, lte } from 'drizzle-orm';
import { getTranslation } from '@/i18n';
import { SORT_FIELDS, SORT_ORDERS, LOG_CATEGORIES, LogCategory, LOG_LEVELS, LogLevel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 获取语言设置
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'admin');

  try {

    // 验证管理员身份
    const adminUser = await verifyAdminInApiRoute(request);

    if (!adminUser) {
      return NextResponse.json(
        errorResponse(t('error.forbidden')),
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sort') || 'timestamp';
    const sortOrder = searchParams.get('order') || 'desc';

    // 验证排序参数
    const finalSortBy = SORT_FIELDS.LOGS.includes(sortBy as any) ? sortBy : 'timestamp';
    const finalSortOrder = SORT_ORDERS.includes(sortOrder.toLowerCase() as any) ? sortOrder.toLowerCase() : 'desc';
    const level = searchParams.get('level') as LogLevel | null;
    const category = searchParams.get('category') as LogCategory | null;
    const search = searchParams.get('search') || '';

    // 验证分页参数
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        errorResponse(t('validation.invalidPageOrLimit')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 构建查询条件
    const whereConditions = [];

    if (level) {
      whereConditions.push(like(systemLogs.level, level));
    }

    if (category) {
      whereConditions.push(like(systemLogs.category, category));
    }

    if (search) {
      whereConditions.push(
        or(
          like(systemLogs.message, `%${search}%`),
          like(systemLogs.details, `%${search}%`)
        )
      );
    }

    // 获取总数
    const totalQuery = db
      .select({ count: systemLogs.id })
      .from(systemLogs);

    let countResult;
    if (whereConditions.length > 0) {
      countResult = await totalQuery.where(and(...whereConditions));
    } else {
      countResult = await totalQuery;
    }

    const total = countResult.length;

    if (total === 0) {
      return NextResponse.json(
        successResponse({
          logs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        }, t('success.noLogsFound')),
        { status: HTTP_STATUS.OK }
      );
    }

    // 构建排序配置
    let orderBy;
    switch (finalSortBy) {
      case 'timestamp':
        orderBy = finalSortOrder === 'asc' ? asc(systemLogs.timestamp) : desc(systemLogs.timestamp);
        break;
      case 'level':
        orderBy = finalSortOrder === 'asc' ? asc(systemLogs.level) : desc(systemLogs.level);
        break;
      case 'category':
        orderBy = finalSortOrder === 'asc' ? asc(systemLogs.category) : desc(systemLogs.category);
        break;
      default:
        orderBy = desc(systemLogs.timestamp);
    }

    // 执行查询
    const logsQuery = db
      .select()
      .from(systemLogs);

    let logsResult;
    if (whereConditions.length > 0) {
      logsResult = await logsQuery.where(and(...whereConditions)).orderBy(orderBy).limit(limit).offset(offset);
    } else {
      logsResult = await logsQuery.orderBy(orderBy).limit(limit).offset(offset);
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      successResponse({
        logs: logsResult,
        total,
        page,
        limit,
        totalPages,
      }, t('success.logsRetrieved')),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Admin system logs list error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}