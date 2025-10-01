import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { accessTokens } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { UserService } from '@/lib/services';

// 认证助手函数
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  console.log('[MCP] Auth header present:', !!authHeader);
  
  if (!authHeader) {
    console.log('[MCP] No auth header, returning 401');
    return null;
  }

  const token = authHeader.split(' ')[1];
  console.log('[MCP] Token extracted:', token ? 'present' : 'missing');
  
  if (!token) {
    console.log('[MCP] No token, returning 401');
    return null;
  }

  try {
    console.log('[MCP] Looking up access token in database');
    // 从新的 accessTokens 表中查找令牌
    const tokenRecord = await db.query.accessTokens.findFirst({
      where: eq(accessTokens.accessToken, token)
    });

    console.log('[MCP] Access token found:', !!tokenRecord);
    
    if (!tokenRecord) {
      console.log('[MCP] No access token found, returning 401');
      return null;
    }

    const tokenExpiresAt = tokenRecord.accessTokenExpiresAt;
    if (!tokenExpiresAt) {
      console.log('[MCP] Token has no expiration, returning continue');
    } else {
      console.log('[MCP] Token expires at:', tokenExpiresAt);
      console.log('[MCP] Current time:', new Date());
      
      if (tokenExpiresAt < new Date()) {
        console.log('[MCP] Token expired, returning 401');
        return null;
      }
    }

    // 从数据库获取完整的用户信息
    const userDetails = await UserService.findUserById(tokenRecord.userId);
    if (!userDetails) {
      console.log('[MCP] User not found for token, returning 401');
      return null;
    }
    
    // 获取用户的个人空间
    const personalSpace = await UserService.getUserPersonalSpace(userDetails.id);
    if (!personalSpace) {
      console.log('[MCP] Personal space not found for user, returning 401');
      return null;
    }

    console.log('[MCP] Authentication successful');
    return {
      user: {
        ...userDetails,
        personalSpaceId: personalSpace?.id || null
      },
      token: tokenRecord
    };
  } catch (e) {
    console.error('[MCP] Error validating token:', e);
    return null;
  }
}

export { authenticateRequest };