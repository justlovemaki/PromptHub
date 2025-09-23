import { NextRequest } from 'next/server';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { addConnection, removeConnection } from '@/lib/sse-manager';
import { getLanguageFromNextRequest } from '@/lib/utils';
import { getTranslation } from '@/i18n';

// 告诉 Next.js 这是一个动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  try {
    // 使用认证助手验证用户
    const user = await verifyUserInApiRoute(request);
    
    if (!user) {
      return new Response(t('error.unauthorized'), { status: 401 });
    }
    
    // 创建SSE流
    const stream = new ReadableStream({
      start(controller) {
        // 生成连接ID
        const connectionId = `${user.id}_${Date.now()}`;
        
        // 存储连接
        addConnection(connectionId, {
          controller,
          userId: user.id,
          personalSpaceId: user.personalSpaceId,
        });
        
        // 发送初始连接消息
        const initialMessage = {
          type: 'connected',
          data: {
            connectionId,
            message: t('sse.connected')
          }
        };
        
        controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);
        
        // 设置心跳检测
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
          } catch (error) {
            // 连接已关闭
            clearInterval(heartbeat);
            removeConnection(connectionId);
          }
        }, 30000); // 每30秒发送心跳
        
        // 清理连接的回调
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          removeConnection(connectionId);
        });
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
    
  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response(t('error.internalServer'), { status: 500 });
  }
}

