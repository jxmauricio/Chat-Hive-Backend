import { Provider } from '@nestjs/common';
import OpenAI from 'openai';

export const OPENAI = 'OPENAI_CLIENT';

export const OpenAIProvider: Provider = {
  provide: OPENAI,
  useFactory: (): OpenAI => {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  },
};