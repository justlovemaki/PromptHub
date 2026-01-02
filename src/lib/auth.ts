import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt,bearer } from "better-auth/plugins";
import { db } from "./database";
import { FALLBACK_DEFAULT_CONFIG } from "./constants";
import * as pgSchema from '../drizzle-postgres-schema';
import * as sqliteSchema from '../drizzle-sqlite-schema';

// 确定数据库类型
const isSupabase = !!process.env.SUPABASE_URL;
const isNeon = !!process.env.NEON_DATABASE_URL;
const isTurso = !!process.env.TURSO_DATABASE_URL;
const dbProvider = isSupabase ? "pg" : (isNeon ? "pg" : (isTurso ? "sqlite" : "sqlite"));

// 根据数据库类型选择正确的模式
const authSchema = isSupabase ? pgSchema : (isNeon ? pgSchema : sqliteSchema);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: dbProvider,
    schema: authSchema,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 5 * 60 // Cache duration in seconds
    // }
  },
  logger: {
		disabled: false,
		disableColors: false,
		level: "info",
		log: (level, message, ...args) => {
			// Custom logging implementation
			console.log(`[${level}] ${message}`, ...args);
		}
	},
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!, 
  telemetry: {
    enabled: false,
  },
  emailAndPassword: {
    enabled: true,
    autoSignUp: true,
    // requireEmailVerification: !(process.env.VERIFY_EMAIL === "false"),
    //   async sendResetPassword({ user, url }) {
    //       await resend.emails.send({
    //           from,
    //           to: user.email,
    //           subject: "Reset your password",
    //           text: `Hey ${user.name}, here is your password reset link: ${url}`,
    //           // Doesn't work with edge runtime atm.
    //           // See https://github.com/resend/react-email/issues/1630
    //           // react: reactResetPasswordEmail({
    //           //     username: user.name,
    //           //     resetLink: url,
    //           // }),
    //       });
    // },
    // // Custom hasher to avoid hitting CPU limit
    // password: { hash, verify },
  },
  // emailVerification: {
  //     async sendVerificationEmail({ user, url }) {
  //         await resend.emails.send({
  //             from,
  //             to: user.email,
  //             subject: "Verify your email address",
  //             text: `Hey ${user.name}, verify your email address, please: ${url}`,
  //             // Doesn't work with edge runtime atm.
  //             // See https://github.com/resend/react-email/issues/1630
  //             // react: reactVerifyEmailEmail({
  //             //     username: user.name,
  //             //     verificationLink: url,
  //             // }),
  //         });
  //     },
  // },
  account: {
    accountLinking: {
      enabled: true,
      requireEmailVerification: false,
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});