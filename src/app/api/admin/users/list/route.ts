import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyAdminInApiRoute } from '@/lib/auth-helpers';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { sql, asc, desc } from 'drizzle-orm';
import { getTranslation } from '@/i18n';
import { SORT_FIELDS, VALID_USER_ROLES, VALID_SUBSCRIPTION_STATUSES } from '@/lib/constants';

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
    
    // 获取分页和排序参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';
    const searchTerm = searchParams.get('search') || '';

    // 验证排序字段并构建orderBy
    const validSortField = SORT_FIELDS.USERS.includes(sortField as any) ? sortField : 'createdAt';

    // 构建orderBy对象
    let orderBy;
    switch (validSortField) {
      case 'id':
        orderBy = sortOrder === 'asc' ? asc(user.id) : desc(user.id);
        break;
      case 'email':
        orderBy = sortOrder === 'asc' ? asc(user.email) : desc(user.email);
        break;
      case 'name':
        orderBy = sortOrder === 'asc' ? asc(user.name) : desc(user.name);
        break;
      case 'role':
        orderBy = sortOrder === 'asc' ? asc(user.role) : desc(user.role);
        break;
      case 'subscriptionStatus':
        orderBy = sortOrder === 'asc' ? asc(user.subscriptionStatus) : desc(user.subscriptionStatus);
        break;
      case 'createdAt':
        orderBy = sortOrder === 'asc' ? asc(user.createdAt) : desc(user.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder === 'asc' ? asc(user.updatedAt) : desc(user.updatedAt);
        break;
      default:
        orderBy = desc(user.createdAt); // 默认按创建时间降序
    }
    
    // 构建搜索和筛选条件
    let whereCondition = sql` 1=1 `; // 默认条件

    if (searchTerm) {
      whereCondition = sql`${whereCondition} AND (${user.email} LIKE ${`%${searchTerm}%`} OR ${user.name} LIKE ${`%${searchTerm}%`})`;
    }

    // 角色筛选
    const roleFilter = searchParams.get('role');
    if (roleFilter && VALID_USER_ROLES.includes(roleFilter as any)) {
      whereCondition = sql`${whereCondition} AND ${user.role} = ${roleFilter}`;
    }

    // 订阅状态筛选
    const subscriptionFilter = searchParams.get('subscriptionStatus');
    if (subscriptionFilter && VALID_SUBSCRIPTION_STATUSES.includes(subscriptionFilter as any)) {
      whereCondition = sql`${whereCondition} AND ${user.subscriptionStatus} = ${subscriptionFilter}`;
    }

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
      where: whereCondition,
      orderBy,
    });

    // 获取用户总数（支持搜索和筛选过滤）
    let totalWhereCondition = sql`1=1`;

    if (searchTerm) {
      totalWhereCondition = sql`${totalWhereCondition} AND (${user.email} LIKE ${`%${searchTerm}%`} OR ${user.name} LIKE ${`%${searchTerm}%`})`;
    }

    if (roleFilter && VALID_USER_ROLES.includes(roleFilter as any)) {
      totalWhereCondition = sql`${totalWhereCondition} AND ${user.role} = ${roleFilter}`;
    }

    if (subscriptionFilter && VALID_SUBSCRIPTION_STATUSES.includes(subscriptionFilter as any)) {
      totalWhereCondition = sql`${totalWhereCondition} AND ${user.subscriptionStatus} = ${subscriptionFilter}`;
    }

    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(user).where(totalWhereCondition);
    const totalUsers = await totalQuery;
    const total = totalUsers[0].count;

    return NextResponse.json(
      successResponse({
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }, t('success.usersRetrieved')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}