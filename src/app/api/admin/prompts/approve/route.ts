import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminInApiRoute } from '@/lib/auth-helpers'
import { db } from '@/lib/database'
import { prompt } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils'
import { eq } from 'drizzle-orm'
import { getTranslation } from '@/i18n'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// 请求体验证 schema
const approveSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
  isApproved: z.boolean()
})

export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body = await request.json()
    
    // 验证请求参数
    const validationResult = approveSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidParams') || 'Invalid parameters'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const { id, isApproved } = validationResult.data

    // 检查提示词是否存在
    const existingPrompt = await db.query.prompt.findFirst({
      where: eq(prompt.id, id)
    })

    if (!existingPrompt) {
      return NextResponse.json(
        errorResponse(t('error.notFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    // 更新审核状态
    const [updatedPrompt] = await db.update(prompt)
      .set({
        isApproved,
        // updatedAt: new Date()
      })
      .where(eq(prompt.id, id))
      .returning()

    return NextResponse.json(
      successResponse({
        prompt: {
          ...updatedPrompt,
          tags: updatedPrompt.tags ? JSON.parse(updatedPrompt.tags) : []
        }
      }, t('success.approvalUpdated') || 'Approval status updated successfully'),
      { status: HTTP_STATUS.OK }
    )

  } catch (error) {
    console.error('Admin approve prompt error:', error)
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}