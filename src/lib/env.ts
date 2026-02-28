import { z } from "zod";

const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required"),

  // Email (SMTP)
  SMTP_USER: z.string().email("SMTP_USER must be a valid email"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM_NAME: z.string().default("Jewellery Store"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Razorpay (optional — only needed when payment flows are configured)
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),

  // Optional
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _env: ServerEnv | undefined;

export function validateEnv(): ServerEnv {
  if (_env) return _env;

  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nSee .env.local.example for required variables.\n`,
    );
  }

  _env = result.data;
  return _env;
}
