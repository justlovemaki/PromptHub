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
    const search = searchParams.get('search') || undefined;
    const spaceId = searchParams.get('spaceId') || user.personalSpaceId
    // 使用新的方法直接获取标签（包含标签名和出现次数）
    const tagsWithCount = await PromptService.getTagsBySpaceId(spaceId, search);

    return NextResponse.json(
      successResponse(tagsWithCount, t('success.tagsRetrieved')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Get prompt tags error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}