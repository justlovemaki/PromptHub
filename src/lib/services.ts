import { eq, and, desc, asc, like, or, sql, gte, lte } from 'drizzle-orm';

import { db } from './database';
import { user, space, membership, prompt, systemLogs, NewSystemLogs, aiPointTransaction, promptFavorite } from '../drizzle-schema';
import { generateId } from './utils';
import { SPACE_TYPES, USER_ROLES, LOG_LEVELS, LOG_CATEGORIES, AI_POINTS_TYPES, SORT_FIELDS, SORT_ORDERS } from './constants';
const isNeon = !!process.env.NEON_DATABASE_URL;
const isSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============== 日期时区处理服务 ==============

export class DateService {
  /**
   * 将日期转换为当前系统时区的格式化字符串
   * @param date 要转换的日期对象
   * @param includeTime 是否包含时间，默认为 true
   * @returns 当前系统时区的日期(时间)字符串
   */
  static convertToSystemTimezone(date: Date | string, includeTime: boolean = true): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 获取当前系统时区的格式化选项
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }
    
    // 使用系统默认时区进行格式化
    return new Intl.DateTimeFormat(undefined, options).format(dateObj);
  }

  /**
   * 获取当前系统时区的时区名称
   * @returns 系统时区名称，如 'Asia/Shanghai'
   */
  static getSystemTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * 将日期转换为系统时区的时间戳
   * @param date 要转换的日期对象
   * @returns 系统时区的日期对象
   */
  static toSystemTimezoneDate(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 获取系统时区偏移量（分钟）
    const timezoneOffset = new Date().getTimezoneOffset();
    
    // 计算系统时区的时间
    const localTime = dateObj.getTime() - (timezoneOffset * 60000);
    const utc = new Date(localTime + (timezoneOffset * 60000));
    
    return new Date(utc.getTime() + (timezoneOffset * 60000));
  }
  /**
   * 获取当前 UTC 时间的 Date 对象。
   * @returns 当前 UTC 时间的 Date 对象。
   */
  static getCurrentUTCDate(): Date {
    return new Date(); // 创建一个表示当前时刻的Date对象，内部存储为UTC毫秒
  }

  /**
   * 从 UTC 年、月、日、时、分、秒、毫秒创建 Date 对象。
   * @param year UTC 年
   * @param month UTC 月 (0-11)
   * @param day UTC 日 (1-31)
   * @param hours UTC 小时 (0-23)
   * @param minutes UTC 分 (0-59)
   * @param seconds UTC 秒 (0-59)
   * @param milliseconds UTC 毫秒 (0-999)
   * @returns UTC 时间的 Date 对象
   */
  static createUTCDate(
    year: number,
    month: number,
    day: number = 1,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
  ): Date {
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
  }
}


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
      const now = DateService.getCurrentUTCDate();
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
    imageUrls?: string[];
    author?: string;
    isPublic?: boolean;
    useCount?: number;
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
      imageUrls: JSON.stringify(promptData.imageUrls || []),
      author: promptData.author || "",
      isPublic: promptData.isPublic ?? false,
      useCount: promptData.useCount ?? 0,
      spaceId: promptData.spaceId,
      createdBy: promptData.createdBy,
      updatedAt: DateService.getCurrentUTCDate(),
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
      getAll?: boolean; // 添加获取所有记录的选项
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
      sortOrder = SORT_ORDERS[1], // 'desc'
      getAll = false // 获取所有记录的选项，默认为false
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
          like(prompt.tags, `%${search}%`),
          like(prompt.author, `%${search}%`)
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

    // 执行查询
    const orderByArray = secondaryOrderBy ? [orderByCondition, secondaryOrderBy] : [orderByCondition];
    let prompts;
    
    if (getAll) {
      // 如果需要获取所有记录，不设置limit和offset
      prompts = await db.query.prompt.findMany({
        where: and(...conditions),
        orderBy: orderByArray,
      });
    } else {
      // 计算偏移量
      const offset = (page - 1) * limit;
      
      // 执行带分页的查询
      prompts = await db.query.prompt.findMany({
        where: and(...conditions),
        orderBy: orderByArray,
        limit: limit,
        offset: offset,
      });
    }

    // 解析JSON字段
    prompts = prompts.map(p => {
      const parsed = { ...p };
      if (parsed.tags) {
        try {
          parsed.tags = JSON.parse(parsed.tags);
        } catch (e) {
          parsed.tags = [];
        }
      }
      if (parsed.imageUrls) {
        try {
          parsed.imageUrls = JSON.parse(parsed.imageUrls);
        } catch (e) {
          parsed.imageUrls = [];
        }
      }
      return parsed;
    });

    // 获取总数
    const total = await db.$count(prompt, and(...conditions));

    return {
      prompts,
      total,
      page: getAll ? 1 : page,
      limit: getAll ? prompts.length : limit,
      totalPages: getAll ? 1 : Math.ceil(total / limit)
    };
  }

  static async getPublicPromptsWithImages(options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: typeof SORT_FIELDS.PROMPTS[number];
    sortOrder?: typeof SORT_ORDERS[number];
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = SORT_FIELDS.PROMPTS[2], // 'updatedAt'
      sortOrder = SORT_ORDERS[1], // 'desc'
    } = options || {};

    const conditions = [
      eq(prompt.isPublic, true),
      eq(prompt.approvalStatus, "APPROVED"),
      like(prompt.tags, '%imageGeneration%'),
      // 确保 imageUrls 有值（不为空、不为 null、不为空数组 "[]"）
      sql`${prompt.imageUrls} IS NOT NULL AND ${prompt.imageUrls} != '' AND ${prompt.imageUrls} != '[]'`
    ];

    if (search) {
      conditions.push(
        or(
          like(prompt.title, `%${search}%`),
          like(prompt.description, `%${search}%`),
          like(prompt.tags, `%${search}%`),
          like(prompt.author, `%${search}%`)
        )!
      );
    }

    const orderByField = prompt[sortBy as typeof SORT_FIELDS.PROMPTS[number]];
    const orderByCondition = sortOrder === SORT_ORDERS[0] ? asc(orderByField) : desc(orderByField);
    
    // Default secondary sort by updatedAt desc
    const secondaryOrderBy = sortBy !== SORT_FIELDS.PROMPTS[2] ? desc(prompt.updatedAt) : undefined;
    const orderByArray = secondaryOrderBy ? [orderByCondition, secondaryOrderBy] : [orderByCondition];

    const offset = (page - 1) * limit;

    const prompts = await db.query.prompt.findMany({
      where: and(...conditions),
      orderBy: orderByArray,
      limit,
      offset,
    });

    // Parse JSON fields
    const parsedPrompts = prompts.map(p => {
      const parsed = { ...p };
      if (parsed.tags) {
        try {
          parsed.tags = JSON.parse(parsed.tags);
        } catch (e) {
          parsed.tags = [];
        }
      }
      if (parsed.imageUrls) {
        try {
          parsed.imageUrls = JSON.parse(parsed.imageUrls);
        } catch (e) {
          parsed.imageUrls = [];
        }
      }
      return parsed;
    });

    const total = await db.$count(prompt, and(...conditions));

    return {
      prompts: parsedPrompts,
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
    imageUrls?: string[];
    author?: string;
    isPublic?: boolean;
  }) {
    const updateData: any = { ...updates };
    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }
    if (updates.imageUrls !== undefined) {
      updateData.imageUrls = JSON.stringify(updates.imageUrls);
    }
    
    // 自动设置更新时间
    updateData.updatedAt = DateService.getCurrentUTCDate();
    
    const [updatedPrompt] = await db.update(prompt)
      .set(updateData)
      .where(eq(prompt.id, promptId))
      .returning();
    
    updatedPrompt.tags = JSON.parse(updatedPrompt.tags);
    if (updatedPrompt.imageUrls) {
      updatedPrompt.imageUrls = JSON.parse(updatedPrompt.imageUrls);
    }
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
    
    if (foundPrompt) {
      if (foundPrompt.tags) {
        foundPrompt.tags = JSON.parse(foundPrompt.tags);
      }
      if (foundPrompt.imageUrls) {
        foundPrompt.imageUrls = JSON.parse(foundPrompt.imageUrls);
      }
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
        updatedAt: DateService.getCurrentUTCDate()
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
          console.error('Error parsing tag JSON:', error);
        }
      }
    });

    // 将Map转换为对象数组并按出现次数降序排序
    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // 清空指定空间中的所有提示词
  static async clearPromptsBySpace(spaceId: string) {
    // 先查询该空间中的提示词数量
    const count = await db.$count(prompt, eq(prompt.spaceId, spaceId));
    
    // 删除指定空间中的所有提示词
    await db.delete(prompt).where(eq(prompt.spaceId, spaceId));
    
    return { clearedCount: count };
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
        timestamp: DateService.getCurrentUTCDate(),
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
      // 计算本月开始时间（使用UTC时间确保时区一致性）
      const now = DateService.getCurrentUTCDate();
      const monthStart = DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
      // console.log('monthStart', monthStart)

      // 1. 获取用户AI点数使用情况（根据参数决定是否包含使用记录）
      const aiPointsUsage = await AIPointsService.getUserAIPointsUsage(userId, null, null, AI_POINTS_TYPES.USE, false)

      // 2. 获取提示词统计数据（合并 PromptService.getPromptStats 的逻辑）
      const [stats] = await db
        .select({
          totalPrompts: sql<number>`count(*)`,
          publicPrompts: sql<number>`sum(case when ${prompt.isPublic} = true then 1 else 0 end)`,
          privatePrompts: sql<number>`sum(case when ${prompt.isPublic} = false then 1 else 0 end)`,
          monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${(isNeon || isSupabase) ? monthStart.toISOString() : monthStart.getTime()} then 1 else 0 end)`,
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
      console.error('DashboardService.getDashboardStats error:', error);
      throw error;
    }
  }

  static async getPromptStats(spaceId: string) {
    // 计算本月开始时间（使用UTC时间确保时区一致性）
    const now = DateService.getCurrentUTCDate();
    const monthStart = DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
    // console.log('monthStart', monthStart)

    // 查询统计数据
    const [stats] = await db
      .select({
        totalPrompts: sql<number>`count(*)`,
        publicPrompts: sql<number>`sum(case when ${prompt.isPublic} = true then 1 else 0 end)`,
        privatePrompts: sql<number>`sum(case when ${prompt.isPublic} = false then 1 else 0 end)`,
        monthlyCreated: sql<number>`sum(case when ${prompt.createdAt} >= ${(isNeon || isSupabase) ? monthStart.toISOString() : monthStart.getTime()} then 1 else 0 end)`,
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
    const now = DateService.getCurrentUTCDate();
    let monthStart = startDate ? new Date(startDate) : DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), 1);
    let monthEnd = endDate ? new Date(endDate) : DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
    
    // 使用UTC时间确保时区一致性
    if (startDate) {
        const start = new Date(startDate);
        monthStart = DateService.createUTCDate(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0, 0);
    } else {
        monthStart = DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
    }
    
    if (endDate) {
        const end = new Date(endDate);
        monthEnd = DateService.createUTCDate(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999);
    } else {
        monthEnd = DateService.createUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999);
    }
    // console.log(monthStart, monthEnd);
    
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

// ============== 收藏服务 ==============

export class FavoriteService {
  /**
   * 添加收藏并复制提示词到用户的个人提示词库
   * 如果用户的提示词库中已存在相同标题和内容的提示词，则不会重复复制
   */
  static async addFavorite(userId: string, promptId: string) {
    const favoriteId = generateId();
    
    // 检查是否已经收藏
    const existing = await db.query.promptFavorite.findFirst({
      where: and(
        eq(promptFavorite.userId, userId),
        eq(promptFavorite.promptId, promptId)
      ),
    });
    
    if (existing) {
      return { alreadyExists: true, favorite: existing, copiedPrompt: null, promptAlreadyInLibrary: false };
    }
    
    // 获取原始提示词信息
    const originalPrompt = await PromptService.getPromptsById(promptId);
    if (!originalPrompt) {
      throw new Error('Prompt not found');
    }
    
    // 获取用户的个人空间
    const personalSpace = await UserService.getUserPersonalSpace(userId);
    if (!personalSpace) {
      throw new Error('User personal space not found');
    }
    
    // 检查用户的提示词库中是否已存在相同标题和内容的提示词
    const existingPromptInLibrary = await db.query.prompt.findFirst({
      where: and(
        eq(prompt.spaceId, personalSpace.id),
        eq(prompt.title, originalPrompt.title),
        eq(prompt.content, originalPrompt.content)
      ),
    });
    
    // 使用事务同时添加收藏和复制提示词（如果不存在）
    return db.transaction(async (tx) => {
      // 1. 添加收藏记录
      const [newFavorite] = await tx.insert(promptFavorite).values({
        id: favoriteId,
        userId,
        promptId,
      }).returning();
      
      // 2. 如果用户的提示词库中不存在相同的提示词，则复制
      if (existingPromptInLibrary) {
        // 提示词已存在于用户的库中，不需要复制
        return {
          alreadyExists: false,
          favorite: newFavorite,
          copiedPrompt: null,
          promptAlreadyInLibrary: true,
          existingPromptId: existingPromptInLibrary.id
        };
      }
      
      // 复制提示词到用户的个人提示词库
      const copiedPromptId = generateId();
      const [copiedPrompt] = await tx.insert(prompt).values({
        id: copiedPromptId,
        title: originalPrompt.title,
        content: originalPrompt.content,
        description: originalPrompt.description,
        tags: Array.isArray(originalPrompt.tags) ? JSON.stringify(originalPrompt.tags) : originalPrompt.tags,
        imageUrls: Array.isArray(originalPrompt.imageUrls) ? JSON.stringify(originalPrompt.imageUrls) : originalPrompt.imageUrls,
        author: originalPrompt.author || "",
        isPublic: false, // 复制的提示词默认为私有
        useCount: 0, // 重置使用次数
        spaceId: personalSpace.id,
        createdBy: userId,
        updatedAt: DateService.getCurrentUTCDate(),
      }).returning();
      
      return { alreadyExists: false, favorite: newFavorite, copiedPrompt, promptAlreadyInLibrary: false };
    });
  }
  
  /**
   * 取消收藏
   */
  static async removeFavorite(userId: string, promptId: string) {
    const result = await db.delete(promptFavorite)
      .where(and(
        eq(promptFavorite.userId, userId),
        eq(promptFavorite.promptId, promptId)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  /**
   * 检查是否已收藏
   */
  static async isFavorited(userId: string, promptId: string) {
    const existing = await db.query.promptFavorite.findFirst({
      where: and(
        eq(promptFavorite.userId, userId),
        eq(promptFavorite.promptId, promptId)
      ),
    });
    
    return !!existing;
  }
  
  /**
   * 批量检查是否已收藏
   */
  static async checkFavorites(userId: string, promptIds: string[]) {
    if (promptIds.length === 0) {
      return {};
    }
    
    const favorites = await db.query.promptFavorite.findMany({
      where: and(
        eq(promptFavorite.userId, userId),
        sql`${promptFavorite.promptId} IN (${sql.join(promptIds.map(id => sql`${id}`), sql`, `)})`
      ),
    });
    
    const favoriteMap: Record<string, boolean> = {};
    promptIds.forEach(id => {
      favoriteMap[id] = favorites.some(f => f.promptId === id);
    });
    
    return favoriteMap;
  }
  
  /**
   * 获取用户的收藏列表
   */
  static async getUserFavorites(userId: string, options?: {
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;
    
    // 获取收藏记录并关联提示词信息
    const favorites = await db.query.promptFavorite.findMany({
      where: eq(promptFavorite.userId, userId),
      orderBy: [desc(promptFavorite.createdAt)],
      limit,
      offset,
    });
    
    // 获取关联的提示词详情
    const promptIds = favorites.map(f => f.promptId);
    if (promptIds.length === 0) {
      return {
        favorites: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
    
    const prompts = await db.query.prompt.findMany({
      where: sql`${prompt.id} IN (${sql.join(promptIds.map(id => sql`${id}`), sql`, `)})`,
    });
    
    // 解析JSON字段
    const parsedPrompts = prompts.map(p => {
      const parsed = { ...p };
      if (parsed.tags) {
        try {
          parsed.tags = JSON.parse(parsed.tags);
        } catch (e) {
          parsed.tags = [];
        }
      }
      if (parsed.imageUrls) {
        try {
          parsed.imageUrls = JSON.parse(parsed.imageUrls);
        } catch (e) {
          parsed.imageUrls = [];
        }
      }
      return parsed;
    });
    
    // 合并收藏信息和提示词信息
    const result = favorites.map(f => {
      const promptData = parsedPrompts.find(p => p.id === f.promptId);
      return {
        ...f,
        prompt: promptData || null
      };
    });
    
    // 获取总数
    const total = await db.$count(promptFavorite, eq(promptFavorite.userId, userId));
    
    return {
      favorites: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
