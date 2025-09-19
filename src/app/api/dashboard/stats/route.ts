import { NextRequest, NextResponse } from 'next/server'
import { verifyUserInApiRoute } from '@/lib/auth-helpers'
import { DashboardService } from '@/lib/services'
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

    if (!user.personalSpaceId) {
      return NextResponse.json(
        errorResponse('Personal space not found'),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // 使用 DashboardService 获取统计数据
    const responseData = await DashboardService.getDashboardStats(user.id, user.personalSpaceId)

    return NextResponse.json(
      successResponse(responseData, 'Dashboard stats retrieved successfully'),
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}