import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt,bearer } from "better-auth/plugins";
import { db } from "./database";
import { FALLBACK_DEFAULT_CONFIG } from "./constants";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  session: {
    expiresIn: 60 * 60 * 24, // 1 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  },
  secret: process.env.BETTER_AUTH_SECRET || FALLBACK_DEFAULT_CONFIG.AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL,
  telemetry: {
    enabled: false,
  },
  emailAndPassword: {
    enabled: true,
    autoSignUp: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      requireEmailVerification: false,
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});