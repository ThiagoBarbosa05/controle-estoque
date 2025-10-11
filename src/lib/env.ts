import z from "zod";

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1).optional().nullable(),
  BETTER_AUTH_URL: z.string().optional().nullable(),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1).optional().nullable(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().nullable(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error("Invalid environment variables");
}

export const env: z.infer<typeof envSchema> = _env.data;
