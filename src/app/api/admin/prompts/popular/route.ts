import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminInApiRoute } from '@/lib/auth-helpers'
import { db } from '@/lib/database'
import { prompt, promptUsage } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils'
import { sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const adminUser = await verifyAdminInApiRoute(request)
    if (!adminUser) {
      return NextResponse.json(
        errorResponse('Forbidden: Admin access required'),
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
        description: prompt.description,
        tags: prompt.tags,
        useCount: prompt.useCount,
        createdAt: prompt.createdAt
      })
      .from(prompt)
      .orderBy(desc(prompt.useCount))
      .limit(limit)

    return NextResponse.json(
      successResponse(popularPrompts, 'Popular prompts retrieved successfully'),
      { status: HTTP_STATUS.OK }
    )

  } catch (error) {
    console.error('Admin popular prompts error:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}