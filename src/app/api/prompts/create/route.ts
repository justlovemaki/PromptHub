import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';

// 创建提示词验证模式
const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
    
    // 验证请求数据
    const validation = createPromptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { title, content, description, tags } = validation.data;

    // 创建提示词
    const newPrompt = await PromptService.createPrompt({
      title,
      content,
      description,
      tags,
      spaceId: user.personalSpaceId,
      createdBy: user.id,
    });

    if (!newPrompt) {
      return NextResponse.json(
        errorResponse('Failed to create prompt'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      successResponse(newPrompt, 'Prompt created successfully'),
      { status: HTTP_STATUS.CREATED }
    );
    
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}