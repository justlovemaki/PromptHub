import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { accessTokens } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { UserService } from '@/lib/services';

// 认证助手函数
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  console.log('[API] Auth header present:', !!authHeader);
  
  if (!authHeader) {
    console.log('[API] No auth header, returning 401');
    return null;
  }

  const token = authHeader.split(' ')[1];
  console.log('[API] Token extracted:', token ? 'present' : 'missing');
  
  if (!token) {
    console.log('[API] No token, returning 401');
    return null;
  }

  try {
    console.log('[API] Looking up access token in database');
    // 从新的 accessTokens 表中查找令牌
    const tokenRecord = await db.query.accessTokens.findFirst({
      where: eq(accessTokens.accessToken, token)
    });

    console.log('[API] Access token found:', !!tokenRecord);
    
    if (!tokenRecord) {
      console.log('[API] No access token found, returning 401');
      return null;
    }

    const tokenExpiresAt = tokenRecord.accessTokenExpiresAt;
    if (!tokenExpiresAt) {
      console.log('[API] Token has no expiration, returning continue');
    } else {
      console.log('[API] Token expires at:', tokenExpiresAt);
      console.log('[API] Current time:', new Date());
      
      if (tokenExpiresAt < new Date()) {
        console.log('[API] Token expired, returning 401');
        return null;
      }
    }

    // 从数据库获取完整的用户信息
    const user = await UserService.findUserById(tokenRecord.userId);
    if (!user) {
      console.log('[API] User not found for token, returning 401');
      return null;
    }
    
    // 获取用户的个人空间
    const personalSpace = await UserService.getUserPersonalSpace(user.id);
    if (!personalSpace) {
      console.log('[API] Personal space not found for user, returning 401');
      return null;
    }

    console.log('[API] Authentication successful');
    return  {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      personalSpaceId: personalSpace?.id || "0x0000000000000000000000000000000000000000",
    };
  } catch (e) {
    console.error('[API] Error validating token:', e);
    return null;
  }
}

export { authenticateRequest };