import { eq, and, desc } from 'drizzle-orm';
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
    spaceId: string;
    createdBy: string;
  }) {
    const promptId = generateId();
    
    const [newPrompt] = await db.insert(prompt).values({
      id: promptId,
      title: promptData.title,
      content: promptData.content,
      description: promptData.description,
      tags: JSON.stringify(promptData.tags || []),
      spaceId: promptData.spaceId,
      createdBy: promptData.createdBy,
      updatedAt: new Date(),
    }).returning();
    
    return newPrompt;
  }
  
  static async getPromptsBySpace(spaceId: string) {
    return db.query.prompt.findMany({
      where: eq(prompt.spaceId, spaceId),
      orderBy: [desc(prompt.updatedAt)],
    });
  }
  
  static async updatePrompt(promptId: string, updates: {
    title?: string;
    content?: string;
    description?: string;
    tags?: string[];
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
    
    return updatedPrompt;
  }
  
  static async deletePrompt(promptId: string) {
    await db.delete(prompt).where(eq(prompt.id, promptId));
    return true;
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
}