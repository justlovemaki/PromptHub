/**
 * 数据库操作辅助函数
 * 在当前版本的 Drizzle ORM 中手动处理更新时间
 */

import { eq } from "drizzle-orm";
import { db } from "./database";
import { user, account, space, prompt } from "../drizzle-schema";

/**
 * 自动添加更新时间的更新操作
 */
export const updateHelpers = {
  /**
   * 更新用户信息，自动设置 updatedAt
   */
  async updateUser(userId: string, data: Partial<typeof user.$inferInsert>) {
    return await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  },

  /**
   * 更新账户信息，自动设置 updatedAt
   */
  async updateAccount(accountId: string, data: Partial<typeof account.$inferInsert>) {
    return await db
      .update(account)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(account.id, accountId));
  },

  /**
   * 更新空间信息，自动设置 updatedAt
   */
  async updateSpace(spaceId: string, data: Partial<typeof space.$inferInsert>) {
    return await db
      .update(space)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(space.id, spaceId));
  },

  /**
   * 更新提示词信息，自动设置 updatedAt
   */
  async updatePrompt(promptId: string, data: Partial<typeof prompt.$inferInsert>) {
    return await db
      .update(prompt)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(prompt.id, promptId));
  },
};

/**
 * 通用的更新时间设置函数
 * 可以在任何更新操作中使用
 */
export function withUpdatedAt<T extends Record<string, any>>(data: T): T & { updatedAt: Date } {
  return {
    ...data,
    updatedAt: new Date(),
  };
}