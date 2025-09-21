import { NextRequest, NextResponse } from 'next/server';
import { PromptService, LogService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';

// 更新提示词验证模式
const updatePromptSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
  data: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 使用认证助手验证用户
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 验证和转换请求数据
    const requestData = {
      id: body.id,
      data: {
        title: body.title?.trim(),
        content: body.content?.trim(), 
        description: body.description?.trim(),
        tags: body.tags ? body.tags.map((tag: string) => tag.trim()) : undefined,
        isPublic: body.isPublic
      }
    };
    
    const validation = updatePromptSchema.safeParse(requestData);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { id, data } = validation.data;

    // 处理标签默认值
    if (data.tags !== undefined) {
      data.tags = data.tags && data.tags.length > 0 ? data.tags : [];
    }

    // 验证提示词所有权
    const isOwner = await PromptService.verifyPromptOwnership(id, user.personalSpaceId);
    if (!isOwner) {
      return NextResponse.json(
        errorResponse('Prompt not found or access denied'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 更新提示词
    const updatedPrompt = await PromptService.updatePrompt(id, data);

    if (!updatedPrompt) {
      return NextResponse.json(
        errorResponse('Failed to update prompt'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: 'Prompt updated successfully',
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
      successResponse(updatedPrompt, 'Prompt updated successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}