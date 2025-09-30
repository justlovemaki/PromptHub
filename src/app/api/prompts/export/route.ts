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

    // 获取查询参数中的spaceId
    const { searchParams } = new URL(request.url);
    // 如果没有提供spaceId，则使用用户的个人空间
    const spaceId = searchParams.get('spaceId') || user.personalSpaceId

    // 获取空间中的所有提示词（设置getAll为true以获取全部记录）
    const result = await PromptService.getPromptsBySpace(spaceId, { getAll: true });

    // 处理返回数据，解析tags等JSON字段
    const processedPrompts = result.prompts.map(prompt => ({
      content: prompt.content,
      isPublic: prompt.isPublic,
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
      title: prompt.title,
      description: prompt.description || '',
    }));

    // 设置响应头以触发文件下载
    const response = new NextResponse(JSON.stringify(processedPrompts, null, 2));
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Content-Disposition', 'attachment; filename="prompts-export.json"');
    
    return response;
    
  } catch (error) {
    console.error('Export prompts error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}