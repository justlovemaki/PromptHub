import { NextRequest, NextResponse } from 'next/server';
import { FavoriteService, PromptService, LogService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { getTranslation } from '@/i18n';

// 添加收藏
export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'explore');

  const favoriteSchema = z.object({
    promptId: z.string().min(1, t('validation.promptIdRequired') || 'Prompt ID is required'),
  });

  try {
    const body = await request.json();
    
    // 验证用户身份
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized') || 'Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 验证请求数据
    const validation = favoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { promptId } = validation.data;

    // 检查提示词是否存在且是公开的
    const promptData = await PromptService.getPromptsById(promptId);
    if (!promptData) {
      return NextResponse.json(
        errorResponse(t('error.promptNotFound') || 'Prompt not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    if (!promptData.isPublic) {
      return NextResponse.json(
        errorResponse(t('error.promptNotPublic') || 'Cannot favorite a private prompt'),
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // 添加收藏并复制提示词到用户的个人提示词库
    const result = await FavoriteService.addFavorite(user.id, promptId);

    // 确定返回消息
    let message: string;
    if (result.alreadyExists) {
      message = t('success.alreadyFavorited') || 'Already favorited';
    } else if (result.promptAlreadyInLibrary) {
      message = t('success.favoriteAddedPromptExists') || 'Favorite added (prompt already exists in your library)';
    } else {
      message = t('success.favoriteAddedAndCopied') || 'Favorite added and copied to your library';
    }

    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: result.alreadyExists
        ? 'Prompt already favorited'
        : result.promptAlreadyInLibrary
          ? 'Prompt favorited (already exists in library)'
          : 'Prompt favorited and copied to personal library',
      details: {
        promptId,
        userId: user.id,
        userEmail: user.email,
        alreadyExists: result.alreadyExists,
        promptAlreadyInLibrary: result.promptAlreadyInLibrary,
        copiedPromptId: result.copiedPrompt?.id,
        existingPromptId: result.existingPromptId,
      },
      userId: user.id,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json(
      successResponse({
        favorited: true,
        alreadyExists: result.alreadyExists,
        promptAlreadyInLibrary: result.promptAlreadyInLibrary,
        copiedPromptId: result.copiedPrompt?.id,
        existingPromptId: result.existingPromptId,
      }, message),
      { status: result.alreadyExists ? HTTP_STATUS.OK : HTTP_STATUS.CREATED }
    );
    
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer') || 'Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'explore');

  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    
    // 验证用户身份
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized') || 'Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    if (!promptId) {
      return NextResponse.json(
        errorResponse(t('validation.promptIdRequired') || 'Prompt ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 取消收藏
    const removed = await FavoriteService.removeFavorite(user.id, promptId);

    // 记录日志
    await LogService.writeLog({
      level: 'INFO',
      category: 'API',
      message: removed ? 'Favorite removed successfully' : 'Favorite not found',
      details: {
        promptId,
        userId: user.id,
        userEmail: user.email,
        removed,
      },
      userId: user.id,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json(
      successResponse({
        favorited: false,
        removed,
      }, removed ? (t('success.favoriteRemoved') || 'Favorite removed successfully') : (t('error.favoriteNotFound') || 'Favorite not found')),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer') || 'Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// 检查收藏状态
export async function GET(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'explore');

  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');
    const promptIds = searchParams.get('promptIds'); // 支持批量查询，逗号分隔
    
    // 验证用户身份
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized') || 'Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 批量查询
    if (promptIds) {
      const ids = promptIds.split(',').filter(id => id.trim());
      const favoriteMap = await FavoriteService.checkFavorites(user.id, ids);
      
      return NextResponse.json(
        successResponse({ favorites: favoriteMap }),
        { status: HTTP_STATUS.OK }
      );
    }
    
    // 单个查询
    if (promptId) {
      const isFavorited = await FavoriteService.isFavorited(user.id, promptId);
      
      return NextResponse.json(
        successResponse({ favorited: isFavorited }),
        { status: HTTP_STATUS.OK }
      );
    }
    
    return NextResponse.json(
      errorResponse(t('validation.promptIdRequired') || 'Prompt ID is required'),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
    
  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer') || 'Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}