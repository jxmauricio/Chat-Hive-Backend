// supabase.provider.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Provider } from '@nestjs/common';

export const SUPABASE = 'SUPABASE_CLIENT';

export const SupabaseProvider: Provider = {
  provide: SUPABASE,
  useFactory: (): SupabaseClient => {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  },
};

