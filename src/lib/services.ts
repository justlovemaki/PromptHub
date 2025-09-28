import { eq, and, desc, asc, like, or, sql, gte, lte } from 'drizzle-orm';

import { db } from './database';
import { user, space, membership, prompt, systemLogs, NewSystemLogs, aiPointTransaction } from '../drizzle-schema';
import { generateId } from './utils';
import { SPACE_TYPES, USER_ROLES, LOG_LEVELS, LOG_CATEGORIES, AI_POINTS_TYPES, SORT_FIELDS, SORT_ORDERS } from './constants';

// 由于当前依赖包还未安装，这里先创建服务层的结构
// 实际运行时需要取消注释并安装相关依赖

export class UserService {
  static async createUser(userData: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: keyof typeof USER_ROLES;
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
      //   role: userData.role || USER_ROLES.USER,
      //   emailVerified: false,
      //   updatedAt: now,
      // }).returning();
    
      // 2. 创建个人空间
      const [newSpace] = await tx.insert(space).values({
        id: spaceId,
        name: userData.name || userData.email,
        type: SPACE_TYPES.PERSONAL,
        ownerId: userId,
        updatedAt: now,
      }).returning();
    
      // 3. 创建成员关系
      // 将用户角色映射到成员关系角色：ADMIN -> ADMIN, USER -> MEMBER
      const membershipRole = (userData.role === USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : USER_ROLES.MEMBER;
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
        eq(space.type, SPACE_TYPES.PERSONAL)
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
      id?: string;
      isPublic?: boolean;
      tag?: string;  // 添加tag参数
      sortBy?: typeof SORT_FIELDS.PROMPTS[number];
      sortOrder?: typeof SORT_ORDERS[number];
    }
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      id,
      isPublic,
      tag,  // 获取tag参数
      sortBy = SORT_FIELDS.PROMPTS[2], // 'updatedAt'
      sortOrder = SORT_ORDERS[1] // 'desc'
    } = options || {};

    // 构建查询条件
    const conditions = [eq(prompt.spaceId, spaceId)];
    
    // 添加ID条件
    if (id) {
      conditions.push(eq(prompt.id, id));
    }
    
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
    
    // 添加标签过滤条件 - 检查JSON数组中是否包含指定标签
    if (tag) {
      // 使用 JSON 函数检查 tags 字段的 JSON 数组中是否包含指定的标签
      // SQLite 中使用 JSON 查询语法
      conditions.push(
        like(prompt.tags, `%${tag}%`)
      );
    }
    
    // 添加可见性过滤
    if (isPublic !== undefined) {
      conditions.push(eq(prompt.isPublic, isPublic));
    }

    // 构建排序条件
    const orderByField = prompt[sortBy as typeof SORT_FIELDS.PROMPTS[number]];
    const orderByCondition = sortOrder === SORT_ORDERS[0] ? asc(orderByField) : desc(orderByField);
    
    // 默认子排序按 updatedAt 降序
    const secondaryOrderBy = sortBy !== SORT_FIELDS.PROMPTS[2] ? desc(prompt.updatedAt) : undefined;

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
    const total = await db.$count(prompt, and(...conditions));

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

  // 通过SQL查询空间ID获取所有提示词的标签
  static async getTagsBySpaceId(spaceId: string, search?: string) {
    // 查询指定空间的所有提示词的标签
    const prompts = await db
      .select({
        tags: prompt.tags,
      })
      .from(prompt)
      .where(
        and(
          eq(prompt.spaceId, spaceId),
          search ? like(prompt.tags, `%${search}%`) : undefined
        )
      )
      .execute();

    // 解析标签字符串并统计出现次数
    const tagCount = new Map<string, number>();
    prompts.forEach(p => {
      if (p.tags) {
        try {
          const tags = JSON.parse(p.tags) as string[];
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag && typeof tag === 'string') {
                const trimmedTag = tag.trim();
                tagCount.set(trimmedTag, (tagCount.get(trimmedTag) || 0) + 1);
              }
            });
          }
        } catch (error) {
          // 忽略无效的 JSON 数据，继续处理其他提示词
          console.error('解析标签JSON时出错:', error);
        }
      }
    });

    // 将Map转换为对象数组并按出现次数降序排序
    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

}

// ============== 系统日志服务 ==============

export class LogService {
  static async writeLog(logData: {
    level: keyof typeof LOG_LEVELS;
    category: keyof typeof LOG_CATEGORIES;
    message: string;
    details?: Record<string, any>;
    userId?: string;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    statusCode?: number;
  }) {
    try {
      const logEntry: NewSystemLogs = {
        id: generateId(),
        level: logData.level,
        category: logData.category,
        message: logData.message,
        details: logData.details ? JSON.stringify(logData.details) : undefined,
        userId: logData.userId,
        userEmail: logData.userEmail,
        ip: logData.ip,
        userAgent: logData.userAgent,
        timestamp: new Date(),
        statusCode: logData.statusCode,
      };

      await db.insert(systemLogs).values(logEntry);
    } catch (error) {
      // 日志写入失败不应该影响主业务流程
      console.error('Failed to write log:', error);
    }
  }
}

// ============== 仪表盘统计服务 ==============

export class DashboardService {
  static async getDashboardStats(userId: string, spaceId: string, includeUsageRecords: boolean = false) {
    try {
      // 计算本月开始时间
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. 获取用户AI点数使用情况（根据参数决定是否包含使用记录）
      const aiPointsUsage = await AIPointsService.getUserAIPointsUsage(userId, null, null, AI_POINTS_TYPES.USE, false)

      // 2. 获取提示词统计数据（合并 PromptService.getPromptStats 的逻辑）
      const [stats] = await db
        .select({
          totalPrompts: sql<number>`count(*)`,
          publicPrompts: sql<number>`sum(case when ${prompt.isPublic} = true then 1 else 0 end)`,
          privatePrompts: sql<number>`sum(case when ${prompt.isPublic} = false then 1 else 0 end)`,
          monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${monthStart.toISOString()} then 1 else 0 end)`,
        })
        .from(prompt)
        .where(eq(prompt.spaceId, spaceId));

      // 3. 获取所有提示词的标签数据（用于统计标签数量）
      const allPrompts = await db
        .select({
          tags: prompt.tags,
        })
        .from(prompt)
        .where(eq(prompt.spaceId, spaceId))
        .execute();
  
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

      return {
        totalPrompts: Number(stats.totalPrompts) || 0,
        publicPrompts: Number(stats.publicPrompts) || 0,
        privatePrompts: Number(stats.privatePrompts) || 0,
        monthlyCreated: Number(stats.monthlyCreated) || 0,
        remainingCredits: aiPointsUsage.remainingPoints,
        tagsCount: uniqueTags.size
      };
    } catch (error) {
      console.error('DashboardService.getDashboardStats 错误:', error);
      throw error;
    }
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
        monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${monthStart.toISOString()} then 1 else 0 end)`,
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
      .orderBy(desc(prompt.createdAt))
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

export class AIPointsService {
  static async getUserAIPointsUsage(userId: string, startDate?: string, endDate?: string, type?: keyof typeof AI_POINTS_TYPES, includeUsageRecords: boolean = false) {
    // 计算日期范围
    const now = new Date();
    const monthStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // 构建查询条件
    const conditions = [
      eq(aiPointTransaction.userId, userId),
      gte(aiPointTransaction.createdAt, monthStart),
      lte(aiPointTransaction.createdAt, monthEnd)
    ];
    
    // 如果提供了type参数，则添加对type字段的过滤条件
    if (type && (type === AI_POINTS_TYPES.EARN || type === AI_POINTS_TYPES.USE || type === AI_POINTS_TYPES.ADMIN)) {
      conditions.push(
        eq(aiPointTransaction.type, type)
      );
    }
    
    // 查询用户本月的AI点数流水记录
    const usageRecords = includeUsageRecords ? await db
      .select({
        id: aiPointTransaction.id,
        userId: aiPointTransaction.userId,
        amount: aiPointTransaction.amount,
        balance: aiPointTransaction.balance,
        type: aiPointTransaction.type,
        description: aiPointTransaction.description,
        relatedId: aiPointTransaction.relatedId,
        createdAt: aiPointTransaction.createdAt,
      })
      .from(aiPointTransaction)
      .where(and(...conditions))
      .orderBy(aiPointTransaction.createdAt) : [];
    
    // 计算总使用点数（只统计类型为"USE"的记录，且amount为负数）
    const totalUsedPoints = usageRecords
      .filter(record => record.type === AI_POINTS_TYPES.USE && record.amount < 0)
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    // 获取用户的订阅信息以获取总点数
    const userDetails = await db
      .select({
        subscriptionStatus: user.subscriptionStatus,
        subscriptionAiPoints: user.subscriptionAiPoints,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    const userInfo = userDetails[0];
    
    // 使用数据库中的subscriptionAiPoints作为总点数
    let totalPoints = userInfo?.subscriptionAiPoints || 0;
    
    // 计算剩余点数
    const remainingPoints = Math.max(0, totalPoints - totalUsedPoints);
    
    return {
      totalPoints,
      usedPoints: totalUsedPoints,
      remainingPoints,
      usageRecords,
    };
  }
  
}