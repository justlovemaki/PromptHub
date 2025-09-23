import { NextRequest, NextResponse } from 'next/server';
import { PromptService, LogService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { getTranslation } from '@/i18n';

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  // 删除提示词验证模式
  const deletePromptSchema = z.object({
    id: z.string().min(1, t('validation.promptIdRequired')),
  });

  try {
    const body = await request.json();
    
    // 使用认证助手验证用户
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 验证请求数据
    const validation = deletePromptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidInput') + ': ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { id } = validation.data;

    // 验证提示词所有权
    const isOwner = await PromptService.verifyPromptOwnership(id, user.personalSpaceId);
    if (!isOwner) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFoundOrAccessDenied')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
 
    // 删除提示词
    await PromptService.deletePrompt(id);
    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: t('log.promptDeletedSuccessfully'),
      details: {
        promptId: id,
        userId: user.id,
        userEmail: user.email,
      },
      userId: user.id,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
 
    return NextResponse.json(
      successResponse(null, t('success.promptDeletedSuccessfully')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}