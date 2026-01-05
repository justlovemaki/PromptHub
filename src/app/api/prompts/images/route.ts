import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/services';
import { SORT_FIELDS, SORT_ORDERS } from '@/lib/constants';
import { encryptData } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt('30');
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as typeof SORT_FIELDS.PROMPTS[number]) || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') as typeof SORT_ORDERS[number]) || 'desc';

    const result = await PromptService.getPublicPromptsWithImages({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    // 加密数据以防止爬虫直接获取
    const encryptedData = encryptData(result);

    return NextResponse.json({
      success: true,
      encrypted: true,
      data: encryptedData,
    });
  } catch (error) {
    console.error('Failed to fetch public prompts with images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}