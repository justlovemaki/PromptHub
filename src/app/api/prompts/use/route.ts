import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { PromptService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const { promptId } = body;
    
    if (!promptId) {
      return NextResponse.json(
        errorResponse('Prompt ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    
    // 增加使用次数
    const updatedPrompt = await PromptService.incrementUseCount(promptId);
    
    if (!updatedPrompt) {
      return NextResponse.json(
        errorResponse('Prompt not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
    
    return NextResponse.json(
      successResponse({
        id: updatedPrompt.id,
        useCount: updatedPrompt.useCount
      }, '使用次数已更新')
    );
    
  } catch (error) {
    console.error('Error incrementing prompt use count:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}