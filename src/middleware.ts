import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { fallbackLng, languages } from './i18n/settings';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);

  // 处理预检请求 (CORS)
  if (request.method === 'OPTIONS') {
    const response = new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24小时
      },
    });
    return response; 
  }

  // API 路由保护
  if (pathname.startsWith('/api/')) {
    // 添加CORS头部到所有API响应
    const response = await handleApiRoutes(request);
    
    // 为API路由添加CORS头部
    if (response.headers) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    
    return response;
  }

  // 国际化路由处理
  const pathnameIsMissingLocale = languages.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // e.g. incoming request is /products
    // The new URL is now /en-US/products

    requestHeaders.set('x-next-pathname', "");
    return NextResponse.rewrite(
      new URL(`/${fallbackLng}${pathname}`, request.url),
      {
        request: {
          headers: requestHeaders,
        },
      }
    );
  }

  requestHeaders.set('x-next-pathname', pathname.split('/')[1]);
  return NextResponse.next(
    {
      request: {
        headers: requestHeaders,
      },
    }
  );
}

async function handleApiRoutes(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 公开路由（不需要认证）
  const publicRoutes = [
    '/api/auth',
    '/api/billing/webhook', // Stripe webhook
    '/api/health', // 健康检查
    '/api/mcp', // MCP服务
  ];
  
  // 检查是否为公开路由
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // 对于需要认证的路由，我们简化验证逻辑
  // 将详细的用户信息验证移到各个 API 路由中处理
  const authHeader = request.headers.get('authorization');
  
  // console.log('Auth header:', authHeader);
  // 基本的 session/token 存在性检查
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: No authentication token provided' },
      { status: 401 }
    );
  }
  
  // 对于管理员路由，我们需要在具体的 API 路由中进行详细验证
  // 这里只是标记，让 API 路由知道需要进行管理员权限检查
  const requestHeaders = new Headers(request.headers);
  if (pathname.startsWith('/api/admin')) {
    requestHeaders.set('x-require-admin', 'true');
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo.ico|robots.txt|sitemap.xml).*)'],
};