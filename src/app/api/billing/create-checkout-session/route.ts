import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { UserService } from '@/lib/services';
import { successResponse, errorResponse, HTTP_STATUS, getLanguageFromNextRequest } from '@/lib/utils';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';
import { db } from '@/lib/database';
import { user as user_table } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { getTranslation } from '@/i18n';

// Stripe 初始化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  const language = getLanguageFromNextRequest(request);
  const { t } = await getTranslation(language, 'user');

  // 创建付费会话验证模式
  const createCheckoutSessionSchema = z.object({
    priceId: z.string().min(1, t('validation.priceIdRequired')),
    successUrl: z.string().url(t('validation.validSuccessUrlRequired')).optional(),
    cancelUrl: z.string().url(t('validation.validCancelUrlRequired')).optional(),
  });
 
  try {
    const body = await request.json();
    
    // 使用认证助手验证用户
    const authenticatedUser = await verifyUserInApiRoute(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        errorResponse(t('error.unauthorized')),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    
    // 验证请求数据
    const validation = createCheckoutSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(t('validation.invalidInput') + ': ' + validation.error.errors.map(e => e.message).join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { priceId, successUrl, cancelUrl } = validation.data;

    // 获取或创建 Stripe 客户
    const userDetails = await UserService.findUserById(authenticatedUser.id);
    if (!userDetails) {
      return NextResponse.json(
        errorResponse(t('error.userNotFound')),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    let customerId = userDetails.stripeCustomerId;

    if (!customerId) {
      // 创建新的 Stripe 客户
      const customer = await stripe.customers.create({
        email: userDetails.email,
        name: userDetails.name || undefined,
        metadata: {
          userId: userDetails.id,
        },
      });
      
      customerId = customer.id;
      
      // 更新用户记录
      await db.update(user_table).set({
        stripeCustomerId: customerId,
      }).where(eq(user_table.id, authenticatedUser.id));
    }

    // 创建 Stripe Checkout 会话
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/billing/cancel`,
      metadata: {
        userId: userDetails.id,
      },
    });

    return NextResponse.json(
      successResponse({
        sessionId: session.id,
        url: session.url,
      }, t('success.checkoutSessionCreated')),
      { status: HTTP_STATUS.CREATED }
    );
    
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      errorResponse(t('error.internalServer')),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}