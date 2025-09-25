import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    // 使用认证助手验证用户
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || undefined;
    const id = searchParams.get('id') || undefined;
    const isPublic = searchParams.get('isPublic');
    const tag = searchParams.get('tag') || undefined;  // 添加tag参数
    const sortBy = searchParams.get('sortBy') || 'updatedAt'; // 默认按更新时间排序
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 默认降序
    
    // 验证分页参数
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // 限制最大100条
    
    // 验证排序参数
    const validSortFields = ['title', 'createdAt', 'updatedAt', 'useCount'] as const;
    const validSortOrders = ['asc', 'desc'] as const;
    
    const finalSortBy = validSortFields.includes(sortBy as any) ? sortBy as 'title' | 'createdAt' | 'updatedAt' | 'useCount' : 'updatedAt';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase() as any) ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'desc';
    
    // 处理isPublic参数
    const isPublicBool = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    
    const spaceId = searchParams.get('spaceId') || user.personalSpaceId
    // 使用PromptService进行数据库层面的查询、过滤、排序和分页
    const result = await PromptService.getPromptsBySpace(spaceId, {
      page: validatedPage,
      limit: validatedLimit,
      search,
      id,
      isPublic: isPublicBool,
      tag,  // 添加tag参数
      sortBy: finalSortBy,
      sortOrder: finalSortOrder
    });
    
    // 处理返回数据，解析tags等JSON字段
    const processedPrompts = result.prompts.map(prompt => ({
      ...prompt,
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
    }));

    // 返回符合PromptListResponseSchema的数据结构
    const responseData = {
      prompts: processedPrompts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };

    return NextResponse.json(
      successResponse(responseData, t('success.promptsRetrieved')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('List prompts error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}