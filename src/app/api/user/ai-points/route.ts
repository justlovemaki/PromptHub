import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { getTranslation } from '@/i18n';
import { AIPointsService } from '@/lib/services';
import { AiPointsType } from '@/lib/constants';

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
    
    // 调用服务层方法获取AI点数使用情况
    const aiPointsData = await AIPointsService.getUserAIPointsUsage(
      authenticatedUser.id,
      startDate,
      endDate,
      type as AiPointsType
    );
    
    return NextResponse.json(
      successResponse(aiPointsData, t('success.aiPointsRetrieved'))
    );
    
  } catch (error) {
    console.error('获取AI点数使用情况失败:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}