import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { prompt } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { getTranslation } from '@/i18n';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    const { id: promptId } = await params;

    if (!promptId) {
      return NextResponse.json(
        errorResponse(t('error.invalidRequest')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 查询提示词详情 - 只返回公开的提示词
    const promptData = await db.query.prompt.findFirst({
      where: eq(prompt.id, promptId),
    });

    if (!promptData) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 检查是否公开
    if (!promptData.isPublic) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 处理返回数据，解析tags和imageUrls等JSON字段
    const processedPrompt = {
      ...promptData,
      tags: typeof promptData.tags === 'string' 
        ? (promptData.tags ? JSON.parse(promptData.tags) : []) 
        : promptData.tags || [],
      imageUrls: typeof (promptData as any).imageUrls === 'string' 
        ? ((promptData as any).imageUrls ? JSON.parse((promptData as any).imageUrls) : []) 
        : (promptData as any).imageUrls || [],
    };

    return NextResponse.json(
      successResponse(processedPrompt, t('success.promptRetrieved')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Get prompt detail error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}