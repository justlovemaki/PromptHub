import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { getTranslation } from '@/i18n';
import { db } from '@/lib/database';
import { membership, prompt } from '@/drizzle-schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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

    // 获取查询参数中的spaceId
    const { searchParams } = new URL(request.url);
    // 如果没有提供spaceId，则使用用户的个人空间
    const spaceId = searchParams.get('spaceId') || user.personalSpaceId;

    // 验证用户是否有权访问该空间
    if (spaceId !== user.personalSpaceId) {
      // 如果不是个人空间，需要检查用户是否是团队空间的成员
      const membershipResult = await db.query.membership.findFirst({
        where: and(
          eq(membership.spaceId, spaceId),
          eq(membership.userId, user.id)
        )
      });
      
      if (!membershipResult) {
        return NextResponse.json(
          errorResponse(t('error.accessDenied')),
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }
    }

    // 清空指定空间中的所有提示词
    const result = await PromptService.clearPromptsBySpace(spaceId);

    return NextResponse.json(
      successResponse({ clearedCount: result.clearedCount }, t('success.promptsCleared')),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Clear prompts error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}