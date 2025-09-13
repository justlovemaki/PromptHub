import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "fallback_secret_key",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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