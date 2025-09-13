import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

// 自定义登录函数，支持自动注册
export const loginOrRegister = async (email: string, password: string) => {
  try {
    // 首先尝试登录
    const loginResult = await signIn.email({
      email,
      password,
    });

    // 如果登录成功，返回结果
    if (!!loginResult.data) {
      return loginResult;
    }

    // 如果登录失败是因为用户不存在，则尝试注册
    if (loginResult.error?.status === 401) {
      console.log("User not found, trying to register...");
      const registerResult = await signUp.email({
        email,
        password,
        name: email.split("@")[0], // 使用邮箱前缀作为用户名
      });

      // 如果注册成功，再次尝试登录
      if (!registerResult.error) {
        return await signIn.email({
          email,
          password,
        });
      }

      return registerResult;
    }

    return loginResult;
  } catch (error) {
    console.error("Login or register error:", error);
    return { error: { message: "An unexpected error occurred" } };
  }
};