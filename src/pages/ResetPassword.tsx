import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

function hasRecoveryToken() {
  return typeof window !== "undefined" && window.location.hash.includes("type=recovery");
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hasRecoveryToken()) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/70 bg-panel/95 shadow-panel backdrop-blur-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password to regain account access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          <Button
            type="button"
            variant="hero"
            className="w-full"
            disabled={submitting}
            onClick={async () => {
              if (!password || password !== confirmPassword) {
                toast.error("Passwords must match.");
                return;
              }
              setSubmitting(true);
              const { error } = await supabase.auth.updateUser({ password });
              setSubmitting(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Password updated.");
              window.location.href = "/";
            }}
          >
            Update password
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
