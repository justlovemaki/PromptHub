import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export interface PromptData {
  title: string;
  content: string;
  isPublic: boolean;
  tags: string[];
  description?: string;
  useCount?: number;
}

export async function POST(request: NextRequest) {
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

    // 解析请求体
    const requestBody = await request.json();
    const promptsData: PromptData[] = requestBody.prompts || requestBody;
    // 如果没有提供spaceId，则使用用户的个人空间
    const spaceId = requestBody.spaceId || user.personalSpaceId

    // 验证数据格式
    if (!Array.isArray(promptsData)) {
      return NextResponse.json(
        errorResponse(t('error.invalidPromptData')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 验证每个提示词的格式
    for (const prompt of promptsData) {
      if (!prompt.title || !prompt.content || typeof prompt.isPublic !== 'boolean') {
        return NextResponse.json(
          errorResponse(t('error.invalidPromptData')),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // 批量导入提示词（倒序导入）
    let importedCount = 0;
    // 将数据倒序处理
    const reversedPromptsData = [...promptsData].reverse();
    for (const promptData of reversedPromptsData) {
      await PromptService.createPrompt({
        title: promptData.title,
        content: promptData.content,
        description: promptData.description || '',
        tags: promptData.tags ? promptData.tags : [],
        isPublic: promptData.isPublic,
        useCount: promptData.useCount || 0, // 使用提供的useCount或默认为0
        spaceId: spaceId,
        createdBy: user.id,
      });
      importedCount++;
    }

    return NextResponse.json(
      successResponse({ importedCount }, t('success.promptsImported')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Import prompts error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}