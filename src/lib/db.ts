// Untyped supabase access for tables not yet present in generated types.
// Once migrations apply and types regenerate, this can be removed in favor of `supabase`.
import { supabase } from "@/integrations/supabase/client";
export const db = supabase as unknown as {
  from: (table: string) => any;
};
