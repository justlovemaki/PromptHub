import { NextResponse, NextRequest } from 'next/server';
import { getSessionData } from "@/lib/server-actions";
import { UserService } from "@/lib/services";

export async function GET(request: NextRequest) {
  const sessionData = await getSessionData();
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "/";
  const pathname = request.nextUrl.searchParams.get('pathname');
  if(!!pathname){
    baseUrl += pathname.replace('/','');
  }

  // 如果没有获取到 session，直接重定向到根目录
  if (!sessionData?.user) {
    const url = new URL(baseUrl, request.url);
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

  // 创建一个 URL 对象，指向要重定向到的根目录
  const url = new URL(baseUrl, request.url);
  url.pathname = baseUrl+'/dashboard';
  // 返回重定向响应
  return NextResponse.redirect(url);
}