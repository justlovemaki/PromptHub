import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { prompt } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils'
import { sql, and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * 获取待审核的公开提示词数量
 * 此接口用于 GitHub Action 定时任务调用
 * 需要通过 API_SECRET_KEY 进行身份验证
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 API 密钥（用于 GitHub Action 调用）
    const authHeader = request.headers.get('authorization')
    const apiSecretKey = process.env.API_SECRET_KEY
    
    if (!apiSecretKey) {
      console.error('API_SECRET_KEY not configured')
      return NextResponse.json(
        errorResponse('Server configuration error'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }
    
    if (!authHeader || authHeader !== `Bearer ${apiSecretKey}`) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // 查询待审核的公开提示词数量（isPublic = true 且 isApproved = false）
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(prompt)
      .where(and(
        eq(prompt.isPublic, true),
        eq(prompt.isApproved, false)
      ))
    
    const pendingCount = result[0]?.count || 0

    return NextResponse.json(
      successResponse({
        pendingCount,
        timestamp: new Date().toISOString()
      }, 'Pending prompts count retrieved successfully'),
      { status: HTTP_STATUS.OK }
    )

  } catch (error) {
    console.error('Get pending prompts count error:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}