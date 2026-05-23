import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const role = session.user.user_metadata?.role;
    if (role === "parent") throw redirect({ to: "/parent/matches" });
    if (role === "babysitter") throw redirect({ to: "/babysitter/dashboard" });
    throw redirect({ to: "/admin" });
  },
  component: () => null,
});
