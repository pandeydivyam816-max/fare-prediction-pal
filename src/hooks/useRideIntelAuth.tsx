import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function isAuthenticatedSession(session: Session | null) {
  return Boolean(session?.access_token && session.user?.id && session.user.aud === "authenticated");
}

export function useRideIntelAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const validSession = isAuthenticatedSession(nextSession) ? nextSession : null;
      setSession(validSession);
      setUser(validSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      const validSession = isAuthenticatedSession(data.session) ? data.session : null;
      setSession(validSession);
      setUser(validSession?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let ignore = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!ignore) setProfile(data ?? null);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  return useMemo(
    () => ({ session, user, profile, loading, isAuthenticated: Boolean(user) }),
    [loading, profile, session, user],
  );
}
