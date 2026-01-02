import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminInApiRoute } from '@/lib/auth-helpers'
import { db } from '@/lib/database'
import { prompt, promptUsage } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils'
import { sql, desc } from 'drizzle-orm'
import { getTranslation } from '@/i18n'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 获取语言设置
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'admin');

  try {
    // 验证管理员身份
    const adminUser = await verifyAdminInApiRoute(request)
    if (!adminUser) {
      return NextResponse.json(
        errorResponse(t('error.forbidden')),
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // 获取热门提示词统计数据
    // 按prompt表的useCount字段排序，该字段记录了每个提示词的使用次数
    const popularPrompts = await db
      .select({
        id: prompt.id,
        title: prompt.title,
        author: prompt.author,
        description: prompt.description,
        tags: prompt.tags,
        useCount: prompt.useCount,
        createdAt: prompt.createdAt
      })
      .from(prompt)
      .orderBy(desc(prompt.useCount))
      .limit(limit)

    return NextResponse.json(
      successResponse(popularPrompts, t('success.promptsRetrieved')),
      { status: HTTP_STATUS.OK }
    )

  } catch (error) {
    console.error('Admin popular prompts error:', error)
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}