import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/database';
import { user } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_TYPES, STRIPE_SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUSES_FOR_FREE, SUBSCRIPTION_STATUS } from '@/lib/constants';

// Stripe 初始化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Webhook 密钥
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }
    
    let event: Stripe.Event;

    try {
      // 验证 webhook 签名
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// 处理 checkout 会话完成
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  // 获取订阅详情
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // 确定订阅类型
  let subscriptionStatus: typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES] = SUBSCRIPTION_TYPES.PRO;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
    subscriptionStatus = SUBSCRIPTION_TYPES.TEAM;
  }
  
  // 更新用户订阅状态
  await db.update(user)
    .set({
      subscriptionStatus,
      subscriptionId,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(user.stripeCustomerId, customerId));
}

// 处理订阅创建
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await updateUserSubscription(subscription);
}

// 处理订阅更新
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await updateUserSubscription(subscription);
}

// 处理订阅删除
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  await db.update(user)
    .set({
      subscriptionStatus: SUBSCRIPTION_STATUS.FREE,
      subscriptionId: null,
      subscriptionEndDate: null,
    })
    .where(eq(user.stripeCustomerId, customerId));
}

// 处理发票支付成功
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // 可以在这里记录支付历史或发送确认邮件
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

// 处理发票支付失败
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // 可以在这里发送支付失败通知
  console.log(`Payment failed for invoice: ${invoice.id}`);
}

// 更新用户订阅信息的通用函数
async function updateUserSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  let subscriptionStatus: typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES] = SUBSCRIPTION_TYPES.PRO;
  const priceId = subscription.items.data[0]?.price.id;
  
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
    subscriptionStatus = SUBSCRIPTION_TYPES.TEAM;
  }
  
  const updateData: any = {
    subscriptionId: subscription.id,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  };
  
  // 根据订阅状态更新
  if (subscription.status === STRIPE_SUBSCRIPTION_STATUS.ACTIVE) {
    updateData.subscriptionStatus = subscriptionStatus;
  } else if (SUBSCRIPTION_STATUSES_FOR_FREE.includes(subscription.status as any)) {
    updateData.subscriptionStatus = SUBSCRIPTION_STATUS.FREE;
  }
  
  await db.update(user)
    .set(updateData)
    .where(eq(user.stripeCustomerId, customerId));
}