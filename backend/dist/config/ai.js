import OpenAI from 'openai';
import { env } from './env.js';
export const aiClient = new OpenAI({
    apiKey: env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});
export const AI_MODEL = env.GEMINI_MODEL;
