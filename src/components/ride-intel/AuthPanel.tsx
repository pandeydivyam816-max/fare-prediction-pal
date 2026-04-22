import { useState } from "react";
import { Mail, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

type Props = {
  isAuthenticated: boolean;
  loading: boolean;
  profile: Profile;
};

export function AuthPanel({ isAuthenticated, loading, profile }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleEmailAuth() {
    try {
      setSubmitting(true);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    try {
      setSubmitting(true);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result?.error) throw result.error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset link sent.");
  }

  if (isAuthenticated) {
    return (
      <Card className="border-border/70 bg-panel/90 shadow-panel backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-success" />
            Signed in
          </CardTitle>
          <CardDescription>History, favorites, and personalized trends are active.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-surface/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{profile?.display_name || "Rider"}</div>
                <div className="text-sm text-muted-foreground">{profile?.home_city || "Route intelligence enabled"}</div>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="glass"
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out.");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-panel/90 shadow-panel backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
        <CardDescription>Save routes, compare historical fares, and sync ride history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-md px-3 py-2 text-sm transition ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md px-3 py-2 text-sm transition ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Create account
          </button>
        </div>
        {mode === "signup" ? (
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
        ) : null}
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" type="email" />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <Button type="button" variant="hero" className="w-full" disabled={submitting || loading} onClick={handleEmailAuth}>
          <Mail className="h-4 w-4" />
          {mode === "signup" ? "Create account" : "Sign in with email"}
        </Button>
        <Button type="button" variant="glass" className="w-full" disabled={submitting || loading} onClick={handleGoogle}>
          Continue with Google
        </Button>
        <button type="button" onClick={handleReset} className="text-sm text-muted-foreground transition hover:text-foreground">
          Forgot password?
        </button>
      </CardContent>
    </Card>
  );
}
