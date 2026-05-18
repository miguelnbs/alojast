import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Promote the current user to admin ONLY if no admin exists yet.
// Safe one-time bootstrap: anyone signed in can claim it, but only when the
// table has zero admins. After the first claim, all future calls are rejected.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("Já existe um admin. Peça acesso a quem já tem.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
