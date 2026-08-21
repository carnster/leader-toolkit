import { useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Run the invite link-up once per signed-in user, not once per app load,
  // so a second account signing in without a page reload still gets linked.
  const linkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) linkInvites(session.user.id);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) linkInvites(session.user.id);
    });

    // Claim any roster rows that were invited by this user's email address.
    // A teammate added by email has no account yet; the moment they sign in,
    // this binds the invite to their real user id and their shared
    // initiatives appear. Failure is silent: the next sign-in retries.
    function linkInvites(userId: string) {
      if (linkedUserIdRef.current === userId) return;
      linkedUserIdRef.current = userId;
      supabase
        .rpc("link_team_invites" as any)
        .then(({ data }) => {
          const n = typeof data === "number" ? data : 0;
          if (n > 0) {
            toast({
              title: "You have been added to a team",
              description:
                n === 1
                  ? "An initiative you were invited to is now on your dashboard."
                  : `${n} initiatives you were invited to are now on your dashboard.`,
            });
          }
        });

      // Same idea, one layer up: claim any organization invite left for this
      // user's email. On a deployment where the organizations schema has not
      // landed yet, the function itself does not exist, so the call is
      // wrapped and any error (including "function does not exist") is
      // silently ignored rather than surfaced.
      // Errors (including "function does not exist" on a deployment without
      // the organizations schema yet) surface on the resolved value rather
      // than as a rejection, but wrap in try/catch anyway in case a network
      // failure throws instead; either way, nothing to do.
      (async () => {
        try {
          await supabase.rpc("link_org_invites" as any);
        } catch {
          // ignored
        }
      })();
    }

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear acting-scope and initiative context so the next account signed
    // into this browser never inherits the previous account's selections.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("network-leader-selected-org");
      window.localStorage.removeItem("district-admin-selected-org");
      window.sessionStorage.removeItem("initiativeId");
    }
    // Drop every cached query so a subsequent sign-in never renders stale
    // data left over from this account.
    queryClient.clear();
    navigate("/auth");
  };

  return { user, session, loading, signOut };
}
