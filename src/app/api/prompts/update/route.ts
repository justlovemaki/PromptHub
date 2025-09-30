import { NextRequest, NextResponse } from 'next/server';
import { PromptService, LogService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { getTranslation } from '@/i18n';

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  // 更新提示词验证模式
  const updatePromptSchema = z.object({
    id: z.string().min(1, t('validation.promptIdRequired')),
    data: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    }),
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
    
    // 验证和转换请求数据
    const requestData = {
      id: body.id,
      data: {
        title: body.title !== undefined && body.title !== null ? body.title.trim() : body.title,
        content: body.content !== undefined && body.content !== null ? body.content.trim() : body.content,
        description: body.description !== undefined && body.description !== null ? body.description.trim() : body.description,
        tags: body.tags !== undefined && body.tags !== null ? body.tags.map((tag: string) => tag.trim()) : body.tags,
        isPublic: body.isPublic
      }
    };
    
    const validation = updatePromptSchema.safeParse(requestData);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidInput') + ': ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
 
    const { id, data } = validation.data;
 
    // 处理标签 - 当传入 null 时应清空标签，传入数组时使用该数组
    if (data.tags !== undefined) {
      if (data.tags === null) {
        data.tags = []; // 如果传入 null，将其转换为空数组以清空标签
      } else {
        data.tags = data.tags || []; // 保留数组或转换为默认空数组
      }
    }

    if (data.description === undefined || data.description === null) {
      data.description = ''; // 将 null 转换为空字符串，以清空描述
    }
 
    // 验证提示词所有权
    const isOwner = await PromptService.verifyPromptOwnership(id, user.personalSpaceId);
    if (!isOwner) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFoundOrAccessDenied')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
 
    // 更新提示词
    const updatedPrompt = await PromptService.updatePrompt(id, data);
 
    if (!updatedPrompt) {
      return NextResponse.json(
        errorResponse(t('error.failedToUpdatePrompt')),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: t('log.promptUpdatedSuccessfully'),
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
      successResponse(updatedPrompt, t('success.promptUpdatedSuccessfully')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}