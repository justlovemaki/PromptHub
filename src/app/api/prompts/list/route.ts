import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 使用认证助手验证用户
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 获取用户的所有提示词
    const prompts = await PromptService.getPromptsBySpace(user.personalSpaceId);

    // 处理返回数据，解析tags等JSON字段
    const processedPrompts = prompts.map(prompt => ({
      ...prompt,
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
    }));

    return NextResponse.json(
      successResponse(processedPrompts, 'Prompts retrieved successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('List prompts error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}