import { NextResponse, NextRequest } from 'next/server';
import { getSessionData } from "@/lib/server-actions";
import { UserService } from "@/lib/services";

export async function GET(request: NextRequest) {
  const sessionData = await getSessionData();
  const pathname = request.nextUrl.searchParams.get('pathname') || '';

  // 如果没有获取到 session，直接重定向
  if (!sessionData?.user) {
    const url = new URL(request.url);
    url.pathname = pathname || '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const personalSpace = await UserService.getUserPersonalSpace(sessionData.user.id);
  if(!personalSpace){
    UserService.createUser({
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      image: sessionData.user.image || undefined,
      role: 'USER',
    });
  }

  // 构建重定向 URL
  const url = new URL(request.url);
  url.pathname = pathname ? `${pathname}/dashboard` : '/dashboard';
  url.search = '';
  
  // 返回重定向响应
  return NextResponse.redirect(url);
}