import { eq, and, desc, asc, like, or, sql } from 'drizzle-orm';
import { db } from './database';
import { user, space, membership, prompt } from '../drizzle-schema';
import { generateId } from './utils';

// 由于当前依赖包还未安装，这里先创建服务层的结构
// 实际运行时需要取消注释并安装相关依赖

export class UserService {
  static async createUser(userData: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: 'USER' | 'ADMIN';
  }) {
    const userId = userData.id || generateId();
    const spaceId = generateId();
    const membershipId = generateId();
    
    // 在事务中创建用户、个人空间和成员关系
    return db.transaction(async (tx) => {
      // 1. 创建用户
      const now = new Date();
      // const [newUser] = await tx.insert(user).values({
      //   id: userId,
      //   email: userData.email,
      //   name: userData.name,
      //   image: userData.image,
      //   role: userData.role || 'USER',
      //   emailVerified: false,
      //   updatedAt: now,
      // }).returning();
    
      // 2. 创建个人空间
      const [newSpace] = await tx.insert(space).values({
        id: spaceId,
        name: '个人空间',
        type: 'PERSONAL',
        ownerId: userId,
        updatedAt: now,
      }).returning();
    
      // 3. 创建成员关系
      // 将用户角色映射到成员关系角色：ADMIN -> ADMIN, USER -> MEMBER
      const membershipRole = (userData.role === 'ADMIN') ? 'ADMIN' : 'MEMBER';
      await tx.insert(membership).values({
        id: membershipId,
        role: membershipRole,
        userId: userId,
        spaceId: spaceId,
      });
    
      // return {
      //   user: newUser,
      //   personalSpace: newSpace,
      // };
    });
  }
  
  static async findUserByEmail(email: string) {
    return db.query.user.findFirst({
      where: eq(user.email, email),
    });
  }
  
  static async findUserById(id: string) {
    return db.query.user.findFirst({
      where: eq(user.id, id),
    });
  }
  
  static async getUserPersonalSpace(userId: string) {
    return db.query.space.findFirst({
      where: and(
        eq(space.ownerId, userId),
        eq(space.type, 'PERSONAL')
      ),
    });
  }
}

export class PromptService {
  static async createPrompt(promptData: {
    title: string;
    content: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    spaceId: string;
    createdBy: string;
        id?: string;

  }) {
    const promptId = generateId();
    
    const [newPrompt] = await db.insert(prompt).values({
      id: promptId,
      title: promptData.title,
      content: promptData.content,
      description: promptData.description,
      tags: JSON.stringify(promptData.tags || []),
      isPublic: promptData.isPublic ?? false,
      spaceId: promptData.spaceId,
      createdBy: promptData.createdBy,
      updatedAt: new Date(),
    }).returning();

    return newPrompt;
  }
  
  static async getPromptsBySpace(
    spaceId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      isPublic?: boolean;
      sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'useCount';
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      isPublic,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = options || {};

    // 构建查询条件
    const conditions = [eq(prompt.spaceId, spaceId)];
    
    // 添加搜索条件
    if (search) {
      conditions.push(
        or(
          like(prompt.title, `%${search}%`),
          like(prompt.description, `%${search}%`),
          like(prompt.tags, `%${search}%`)
        )!
      );
    }
    
    // 添加可见性过滤
    if (isPublic !== undefined) {
      conditions.push(eq(prompt.isPublic, isPublic));
    }

    // 构建排序条件
    const orderByField = prompt[sortBy];
    const orderByCondition = sortOrder === 'asc' ? asc(orderByField) : desc(orderByField);
    
    // 默认子排序按 updatedAt 降序
    const secondaryOrderBy = sortBy !== 'updatedAt' ? desc(prompt.updatedAt) : undefined;

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 执行查询
    const orderByArray = secondaryOrderBy ? [orderByCondition, secondaryOrderBy] : [orderByCondition];
    const prompts = await db.query.prompt.findMany({
      where: and(...conditions),
      orderBy: orderByArray,
      limit: limit,
      offset: offset,
    });

    // 获取总数
    const totalPrompts = await db.query.prompt.findMany({
      where: and(...conditions),
    });
    const total = totalPrompts.length;

    return {
      prompts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  static async updatePrompt(promptId: string, updates: {
    title?: string;
    content?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }) {
    const updateData: any = { ...updates };
    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }
    
    // 自动设置更新时间
    updateData.updatedAt = new Date();
    
    const [updatedPrompt] = await db.update(prompt)
      .set(updateData)
      .where(eq(prompt.id, promptId))
      .returning();
    
    updatedPrompt.tags = JSON.parse(updatedPrompt.tags);
    return updatedPrompt;
  }
  
  static async deletePrompt(promptId: string) {
    await db.delete(prompt).where(eq(prompt.id, promptId));
    return true;
  }
  
  static async getPromptsById(promptId: string) {
    const foundPrompt = await db.query.prompt.findFirst({
      where: eq(prompt.id, promptId),
    });
    
    if (foundPrompt && foundPrompt.tags) {
      foundPrompt.tags = JSON.parse(foundPrompt.tags);
    }
    
    return foundPrompt;
  }
  
  static async verifyPromptOwnership(promptId: string, spaceId: string) {
    const existingPrompt = await db.query.prompt.findFirst({
      where: and(
        eq(prompt.id, promptId),
        eq(prompt.spaceId, spaceId)
      ),
    });
    
    return !!existingPrompt;
  }

  // 增加提示词使用次数
  static async incrementUseCount(promptId: string) {
    const [updatedPrompt] = await db.update(prompt)
      .set({ 
        useCount: sql`${prompt.useCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(prompt.id, promptId))
      .returning();
    
    return updatedPrompt;
  }

  static async getPromptStats(spaceId: string) {
    // 计算本月开始时间
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 查询统计数据
    const [stats] = await db
      .select({
        totalPrompts: sql<number>`count(*)`,
        publicPrompts: sql<number>`sum(case when ${prompt.isPublic} = true then 1 else 0 end)`,
        privatePrompts: sql<number>`sum(case when ${prompt.isPublic} = false then 1 else 0 end)`,
        monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${monthStart.getTime()} then 1 else 0 end)`,
      })
      .from(prompt)
      .where(eq(prompt.spaceId, spaceId));

    // 查询最近创建的提示词（用于统计卡片中显示）
    const recentPrompts = await db
      .select({
        id: prompt.id,
        title: prompt.title,
        createdAt: prompt.createdAt,
        isPublic: prompt.isPublic,
      })
      .from(prompt)
      .where(eq(prompt.spaceId, spaceId))
      .orderBy(sql`${prompt.createdAt} DESC`)
      .limit(5);

    return {
      totalPrompts: Number(stats.totalPrompts) || 0,
      publicPrompts: Number(stats.publicPrompts) || 0,
      privatePrompts: Number(stats.privatePrompts) || 0,
      monthlyCreated: Number(stats.monthlyCreated) || 0,
      recentPrompts: recentPrompts || [],
    };
  }
}

// ============== 仪表盘统计服务 ==============

export class DashboardService {
  static async getDashboardStats(userId: string, spaceId: string) {
    try {
      // 计算本月开始时间
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartMs = monthStart.getTime();

      // 1. 获取用户订阅信息来计算点数
      const userData = await db
        .select({
          subscriptionStatus: user.subscriptionStatus,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      // 根据订阅状态计算剩余点数（模拟数据）
      const userInfo = userData[0];
      let remainingCredits = 1000; // 默认 Free 版
      if (userInfo?.subscriptionStatus === 'PRO') {
        remainingCredits = 5000;
      } else if (userInfo?.subscriptionStatus === 'TEAM') {
        remainingCredits = 10000;
      }

      // 2. 获取提示词统计数据
      const [promptStats] = await db
        .select({
          totalPrompts: sql<number>`count(*)`,
          monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${monthStartMs} then 1 else 0 end)`,
        })
        .from(prompt)
        .where(eq(prompt.spaceId, spaceId));

      // 3. 获取所有提示词的标签数据（用于统计标签数量）
      const allPrompts = await db
        .select({
          tags: prompt.tags,
        })
        .from(prompt)
        .where(eq(prompt.spaceId, spaceId));

      // 计算唯一标签数量
      const uniqueTags = new Set<string>();
      allPrompts.forEach(p => {
        if (p.tags) {
          try {
            const tags = JSON.parse(p.tags) as string[];
            if (Array.isArray(tags)) {
              tags.forEach(tag => {
                if (tag && typeof tag === 'string') {
                  uniqueTags.add(tag.trim());
                }
              });
            }
          } catch (error) {
            // 忽略无效的 JSON 数据
          }
        }
      });

      // 4. 获取最近更新的提示词（用于在仪表盘显示）
      const recentPrompts = await db
        .select({
          id: prompt.id,
          title: prompt.title,
          content: prompt.content, // 添加 content 字段！
          description: prompt.description,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt,
          isPublic: prompt.isPublic,
          useCount: prompt.useCount,
          tags: prompt.tags,
        })
        .from(prompt)
        .where(eq(prompt.spaceId, spaceId))
        .orderBy(sql`${prompt.updatedAt} DESC`)
        .limit(5);

      // 处理最近提示词数据，解析 tags 字段
      const processedRecentPrompts = recentPrompts.map(p => ({
        ...p,
        content: p.content || '', // 确保 content 字段存在
        description: p.description || '',
        useCount: p.useCount || 0,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        tags: p.tags ? (() => {
          try {
            const parsedTags = JSON.parse(p.tags);
            return Array.isArray(parsedTags) ? parsedTags : [];
          } catch {
            return [];
          }
        })() : [],
      }));

      return {
        totalPrompts: Number(promptStats?.totalPrompts) || 0,
        monthlyCreated: Number(promptStats?.monthlyCreated) || 0,
        remainingCredits,
        tagsCount: uniqueTags.size,
        recentPrompts: processedRecentPrompts,
      };
    } catch (error) {
      console.error('DashboardService.getDashboardStats 错误:', error);
      throw new Error('获取仪表盘统计数据失败');
    }
  }
}