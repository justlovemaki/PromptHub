import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminInApiRoute } from '@/lib/auth-helpers'
import { db } from '@/lib/database'
import { prompt } from '@/drizzle-schema'
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils'
import { desc, asc, sql } from 'drizzle-orm'
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
    const isApproved = searchParams.get('isApproved')

    // 验证分页参数
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 100)
    const offset = (validatedPage - 1) * validatedLimit

    // 验证排序参数
    const finalSortBy = SORT_FIELDS.PROMPTS.includes(sortBy as any) ? sortBy : 'updatedAt'
    const finalSortOrder = SORT_ORDERS.includes(sortOrder.toLowerCase() as any) ? sortOrder.toLowerCase() : 'desc'

    // 处理isPublic参数
    const isPublicBool = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined
    // 处理isApproved参数
    const isApprovedBool = isApproved === 'true' ? true : isApproved === 'false' ? false : undefined

    // 构建where条件
    let whereCondition
    const searchCondition = search ? sql`(${prompt.title} LIKE ${`%${search}%`} OR ${prompt.content} LIKE ${`%${search}%`} OR ${prompt.description} LIKE ${`%${search}%`} OR ${prompt.author} LIKE ${`%${search}%`})` : null
    const publicCondition = isPublicBool !== undefined ? sql`${prompt.isPublic} = ${isPublicBool}` : null
    const approvedCondition = isApprovedBool !== undefined ? sql`${prompt.isApproved} = ${isApprovedBool}` : null
    
    // 组合条件
    const conditions = [searchCondition, publicCondition, approvedCondition].filter(Boolean)
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

    // 获取提示词列表
    const prompts = await db.query.prompt.findMany({
      limit: validatedLimit,
      offset,
      where: whereCondition,
      orderBy,
    })

    // 获取总数
    let totalQuery
    if (search && isPublicBool !== undefined) {
      totalQuery = db.select({ count: sql<number>`count(*)` }).from(prompt)
        .where(sql`(${prompt.title} LIKE ${`%${search}%`} OR ${prompt.content} LIKE ${`%${search}%`} OR ${prompt.description} LIKE ${`%${search}%`} OR ${prompt.author} LIKE ${`%${search}%`}) AND ${prompt.isPublic} = ${isPublicBool}`)
    } else if (search) {
      totalQuery = db.select({ count: sql<number>`count(*)` }).from(prompt)
        .where(sql`${prompt.title} LIKE ${`%${search}%`} OR ${prompt.content} LIKE ${`%${search}%`} OR ${prompt.description} LIKE ${`%${search}%`} OR ${prompt.author} LIKE ${`%${search}%`}`)
    } else if (isPublicBool !== undefined) {
      totalQuery = db.select({ count: sql<number>`count(*)` }).from(prompt)
        .where(sql`${prompt.isPublic} = ${isPublicBool}`)
    } else {
      totalQuery = db.select({ count: sql<number>`count(*)` }).from(prompt)
    }
    const totalPrompts = await totalQuery
    const total = totalPrompts[0].count

    // 处理返回数据，解析tags等JSON字段
    const processedPrompts = prompts.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
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