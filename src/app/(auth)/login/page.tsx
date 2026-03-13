"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Music } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();
    
    // First try sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials") || signInError.message.includes("Email not confirmed")) {
         // Attempt signup if user doesn't exist
         const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: "Demo User" } }
         });
         
         if (signUpError) {
           console.error("Signup error:", signUpError);
           setIsLoading(false);
           return window.location.href = "/login?error=auth_failed";
         }
      } else {
         console.error("Login error:", signInError);
         setIsLoading(false);
         return window.location.href = "/login?error=auth_failed";
      }
    }
    
    // Success, redirect to root which handles role-based routing
    window.location.href = "/";
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Music className="h-8 w-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Music Online Academy
            </h1>
            <p className="text-sm text-slate-500">
              Your journey to musical mastery starts here
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error === "auth_failed" 
              ? "Authentication failed. Please try again." 
              : "An error occurred during login."}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-sm font-semibold text-slate-900">Email Address</label>
            <input 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-semibold text-slate-900">Password</label>
            <input 
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-base mt-2"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : "Sign in / Register"}
          </Button>

          <div className="text-xs text-center text-slate-500 pt-2 border-t mt-6">
            Google OAuth requires setup in Supabase dashboard.
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
