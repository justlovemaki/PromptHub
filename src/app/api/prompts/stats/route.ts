import { NextRequest, NextResponse } from 'next/server'
import { verifyUserInApiRoute } from '@/lib/auth-helpers'
import { PromptService } from '@/lib/services'
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await verifyUserInApiRoute(request)
    if (!user) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || user.personalSpaceId

    if (!spaceId) {
      return NextResponse.json(
        errorResponse('Missing spaceId parameter'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // 使用PromptService获取统计数据
    const responseData = await PromptService.getPromptStats(spaceId)

    return NextResponse.json(
      successResponse(responseData, 'Prompt stats retrieved successfully'),
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('获取提示词统计数据失败:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}