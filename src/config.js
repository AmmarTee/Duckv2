import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  CLIENT_ID: z.string(),
  TEST_GUILD_ID: z.string().optional(),
  TZ: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid or missing environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const token = env.DISCORD_TOKEN;
export const clientId = env.CLIENT_ID;
export const testGuildId = env.TEST_GUILD_ID || null;
export const timezone = env.TZ || 'UTC';