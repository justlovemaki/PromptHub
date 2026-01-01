import { NextRequest, NextResponse } from 'next/server';
import { PromptService, LogService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { getTranslation } from '@/i18n';

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  // 创建提示词验证模式
  const createPromptSchema = z.object({
    title: z.string().min(1, t('validation.titleRequired')),
    content: z.string().min(1, t('validation.contentRequired')),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    imageUrls: z.array(z.string().url()).optional(),
    isPublic: z.boolean().optional().default(false),
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
    const validation = createPromptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidInput') + ': ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { title, content, description, tags, imageUrls, isPublic } = validation.data;

    // 处理标签默认值
    const processedTags = tags && tags.length > 0 ? tags : [];
    // 处理图片链接默认值
    const processedImageUrls = imageUrls && imageUrls.length > 0 ? imageUrls : [];

    // 创建提示词
    const newPrompt = await PromptService.createPrompt({
      title,
      content,
      description,
      tags: processedTags,
      imageUrls: processedImageUrls,
      isPublic: isPublic ?? false,
      spaceId: user.personalSpaceId,
      createdBy: user.id,
    });

    if (!newPrompt) {
      return NextResponse.json(
        errorResponse(t('error.failedToCreatePrompt')),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
 
    const newDbPrompt = await PromptService.getPromptsById(newPrompt.id)
    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: t('log.promptCreatedSuccessfully'),
      details: {
        promptId: newPrompt.id,
        title: newPrompt.title,
        userId: user.id,
        userEmail: user.email,
      },
      userId: user.id,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    return NextResponse.json(
      successResponse(newDbPrompt, t('success.promptCreatedSuccessfully')),
      { status: HTTP_STATUS.CREATED }
    );
    
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}