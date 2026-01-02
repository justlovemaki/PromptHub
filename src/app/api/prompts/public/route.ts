import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { prompt } from '@/drizzle-schema';
import { eq, desc, asc, like, or, and, sql } from 'drizzle-orm';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { getTranslation } from '@/i18n';
import { SORT_FIELDS, SORT_ORDERS, PromptSortField, SortOrder } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const search = searchParams.get('search') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // 验证分页参数
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    
    // 验证排序参数
    const validSortFields = SORT_FIELDS.PROMPTS;
    const validSortOrders = SORT_ORDERS;
    
    const finalSortBy = validSortFields.includes(sortBy as any) ? sortBy as PromptSortField : 'updatedAt';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase() as any) ? sortOrder.toLowerCase() as SortOrder : 'desc';
    
    // 构建查询条件 - 只查询公开的提示词
    // Drizzle ORM 会自动处理布尔值与数据库整数的转换
    const conditions = [eq(prompt.isPublic, true)];
    
    // 添加搜索条件
    if (search) {
      conditions.push(
        or(
          like(prompt.title, `%${search}%`),
          like(prompt.description, `%${search}%`),
          like(prompt.tags, `%${search}%`),
          like(prompt.author, `%${search}%`)
        )!
      );
    }
    
    // 添加标签过滤条件
    if (tag) {
      conditions.push(like(prompt.tags, `%${tag}%`));
    }

    // 构建排序条件
    const orderByField = prompt[finalSortBy as typeof SORT_FIELDS.PROMPTS[number]];
    const orderByCondition = finalSortOrder === 'asc' ? asc(orderByField) : desc(orderByField);
    
    // 默认子排序按 updatedAt 降序
    const secondaryOrderBy = finalSortBy !== 'updatedAt' ? desc(prompt.updatedAt) : undefined;
    const orderByArray = secondaryOrderBy ? [orderByCondition, secondaryOrderBy] : [orderByCondition];

    // 计算偏移量
    const offset = (validatedPage - 1) * validatedLimit;
    
    // 执行查询
    const prompts = await db.query.prompt.findMany({
      where: and(...conditions),
      orderBy: orderByArray,
      limit: validatedLimit,
      offset: offset,
    });

    // 获取总数
    const total = await db.$count(prompt, and(...conditions));

    // 处理返回数据，解析tags和imageUrls等JSON字段
    const processedPrompts = prompts.map(p => ({
      ...p,
      tags: typeof p.tags === 'string' ? (p.tags ? JSON.parse(p.tags) : []) : p.tags || [],
      imageUrls: typeof (p as any).imageUrls === 'string' ? ((p as any).imageUrls ? JSON.parse((p as any).imageUrls) : []) : (p as any).imageUrls || [],
    }));

    // 返回数据
    const responseData = {
      prompts: processedPrompts,
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages: Math.ceil(total / validatedLimit)
    };

    return NextResponse.json(
      successResponse(responseData, t('success.promptsRetrieved')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('List public prompts error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}