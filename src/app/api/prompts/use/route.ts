import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { PromptService, LogService } from '@/lib/services';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    // 验证用户身份
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const { promptId } = body;
    
    if (!promptId) {
      return NextResponse.json(
        errorResponse(t('validation.promptIdRequired')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    
    // 增加使用次数
    const updatedPrompt = await PromptService.incrementUseCount(promptId);
    
    if (!updatedPrompt) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: 'Prompt used successfully',
      details: {
        promptId: promptId,
        userId: user.id,
        userEmail: user.email,
        useCount: updatedPrompt.useCount,
      },
      userId: user.id,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    
    return NextResponse.json(
      successResponse({
        id: updatedPrompt.id,
        useCount: updatedPrompt.useCount
      }, t('success.useCountUpdated'))
    );
    
  } catch (error) {
    console.error('Error incrementing prompt use count:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}