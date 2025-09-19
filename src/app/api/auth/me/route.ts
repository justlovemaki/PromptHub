import { NextRequest, NextResponse } from 'next/server';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// 简单的内存缓存和频率限制
const userCache = new Map<string, { data: any; timestamp: number }>()
const requestTracker = new Map<string, number>()
const CACHE_DURATION = 5000 // 5秒缓存
const RATE_LIMIT_DURATION = 2000 // 2秒内最多1次请求

/**
 * 获取当前用户的完整信息
 * GET /api/auth/me
 * 包含缓存和频率限制机制
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authenticatedUser = await verifyUserInApiRoute(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        errorResponse('Unauthorized: Please login first'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const userId = authenticatedUser.id
    const now = Date.now()
    
    // 检查频率限制
    const lastRequestTime = requestTracker.get(userId)
    if (lastRequestTime && (now - lastRequestTime) < RATE_LIMIT_DURATION) {
      console.log('Rate limit hit for user:', userId)
      // 如果有缓存，返回缓存数据
      const cached = userCache.get(userId)
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('Returning cached data due to rate limit')
        return NextResponse.json(
          successResponse(cached.data, 'User information retrieved from cache'),
          { status: HTTP_STATUS.OK }
        )
      }
      // 如果没有缓存，返回限流错误
      return NextResponse.json(
        errorResponse('Too many requests, please try again later'),
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      )
    }
    
    // 更新请求时间
    requestTracker.set(userId, now)
    
    // 检查缓存
    const cached = userCache.get(userId)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached user data for:', userId)
      return NextResponse.json(
        successResponse(cached.data, 'User information retrieved from cache'),
        { status: HTTP_STATUS.OK }
      )
    }
    
    console.log('Fetching fresh user data for:', userId)

    // 从数据库获取完整的用户信息
    const userDetails = await UserService.findUserById(userId);
    
    if (!userDetails) {
      return NextResponse.json(
        errorResponse('User not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 获取用户的个人空间
    const personalSpace = await UserService.getUserPersonalSpace(userDetails.id);

    // 构造返回的用户信息，包含所有必要字段
    const completeUserInfo = {
      id: userDetails.id,
      email: userDetails.email,
      name: userDetails.name,
      emailVerified: userDetails.emailVerified,
      image: userDetails.image,
      createdAt: userDetails.createdAt,
      updatedAt: userDetails.updatedAt,
      username: userDetails.username,
      displayUsername: userDetails.displayUsername,
      role: userDetails.role,
      subscriptionStatus: userDetails.subscriptionStatus,
      stripeCustomerId: userDetails.stripeCustomerId,
      subscriptionId: userDetails.subscriptionId,
      subscriptionEndDate: userDetails.subscriptionEndDate,
      personalSpaceId: personalSpace?.id || null,
    };
    
    // 缓存数据
    userCache.set(userId, { data: completeUserInfo, timestamp: now })
    console.log('Cached user data for:', userId)

    return NextResponse.json(
      successResponse(completeUserInfo, 'User information retrieved successfully'),
      { status: HTTP_STATUS.OK }
    );
    
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}