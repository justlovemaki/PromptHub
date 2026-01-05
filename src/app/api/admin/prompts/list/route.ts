import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminInApiRoute } from '@/lib/auth-helpers'
import { db } from '@/lib/database'
import { prompt, user } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils'
import { desc, asc, sql, eq } from 'drizzle-orm'
import { getTranslation } from '@/i18n'
import { SORT_FIELDS, SORT_ORDERS } from '@/lib/constants'

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
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const spaceId = searchParams.get('spaceId') || undefined
    const isPublic = searchParams.get('isPublic')
    const approvalStatus = searchParams.get('approvalStatus')

    // 验证分页参数
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 100)
    const offset = (validatedPage - 1) * validatedLimit

    // 验证排序参数
    const finalSortBy = SORT_FIELDS.PROMPTS.includes(sortBy as any) ? sortBy : 'updatedAt'
    const finalSortOrder = SORT_ORDERS.includes(sortOrder.toLowerCase() as any) ? sortOrder.toLowerCase() : 'desc'

    // 处理isPublic参数
    const isPublicBool = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined
    // 处理approvalStatus参数 - 支持 PENDING, APPROVED, REJECTED
    const validApprovalStatus = approvalStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(approvalStatus) ? approvalStatus : undefined

    // 构建where条件
    let whereCondition
    const searchCondition = search ? sql`(${prompt.title} LIKE ${`%${search}%`} OR ${prompt.content} LIKE ${`%${search}%`} OR ${prompt.description} LIKE ${`%${search}%`} OR ${prompt.author} LIKE ${`%${search}%`})` : null
    const publicCondition = isPublicBool !== undefined ? sql`${prompt.isPublic} = ${isPublicBool}` : null
    const approvalCondition = validApprovalStatus ? sql`${prompt.approvalStatus} = ${validApprovalStatus}` : null
    
    // 组合条件
    const conditions = [searchCondition, publicCondition, approvalCondition].filter(Boolean)
    if (conditions.length > 0) {
      whereCondition = conditions.length === 1
        ? conditions[0]
        : sql`${conditions.reduce((acc, cond, idx) => idx === 0 ? cond : sql`${acc} AND ${cond}`)}`
    }

    // 构建orderBy
    let orderBy
    switch (finalSortBy) {
      case 'title':
        orderBy = finalSortOrder === 'asc' ? asc(prompt.title) : desc(prompt.title)
        break
      case 'createdAt':
        orderBy = finalSortOrder === 'asc' ? asc(prompt.createdAt) : desc(prompt.createdAt)
        break
      case 'updatedAt':
        orderBy = finalSortOrder === 'asc' ? asc(prompt.updatedAt) : desc(prompt.updatedAt)
        break
      case 'useCount':
        orderBy = finalSortOrder === 'asc' ? asc(prompt.useCount) : desc(prompt.useCount)
        break
      default:
        orderBy = desc(prompt.updatedAt)
    }

    // 获取提示词列表，并关联查询创建用户信息
    const promptsWithUser = await db
      .select({
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        tags: prompt.tags,
        imageUrls: prompt.imageUrls,
        author: prompt.author,
        isPublic: prompt.isPublic,
        approvalStatus: prompt.approvalStatus,
        useCount: prompt.useCount,
        spaceId: prompt.spaceId,
        createdBy: prompt.createdBy,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        creatorName: user.name,
        creatorEmail: user.email,
      })
      .from(prompt)
      .leftJoin(user, eq(prompt.createdBy, user.id))
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(validatedLimit)
      .offset(offset)

    // 获取总数 - 使用与列表查询相同的条件
    const totalQuery = whereCondition
      ? db.select({ count: sql<number>`count(*)` }).from(prompt).where(whereCondition)
      : db.select({ count: sql<number>`count(*)` }).from(prompt)
    const totalPrompts = await totalQuery
    const total = totalPrompts[0].count

    // 处理返回数据，解析tags等JSON字段
    const processedPrompts = promptsWithUser.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      imageUrls: p.imageUrls ? JSON.parse(p.imageUrls) : [],
    }))

    const totalPages = Math.ceil(total / validatedLimit)

    const responseData = {
      prompts: processedPrompts,
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages
    }

    return NextResponse.json(
      successResponse(responseData, t('success.promptsRetrieved')),
      { status: HTTP_STATUS.OK }
    )

  } catch (error) {
    console.error('Admin list prompts error:', error)
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}