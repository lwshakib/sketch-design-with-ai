"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setError("Verification token is missing.");
        return;
      }

      try {
        const { error } = await authClient.verifyEmail({
          query: {
            token,
          },
        });

        if (error) {
          setStatus("error");
          setError(error.message || "Failed to verify email.");
          return;
        }

        setStatus("success");
      } catch {
        setStatus("error");
        setError("An unexpected error occurred.");
      }
    };

    verify();
  }, [token]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        {status === "loading" && (
          <>
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
            <h1 className="text-2xl font-bold">Verifying your email</h1>
            <p className="text-muted-foreground text-sm">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle2 className="text-primary h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Email verified!</h1>
            <p className="text-muted-foreground text-sm">
              Your email address has been successfully verified. Redirecting you
              to the login page...
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/sign-in">Go to Login</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Verification failed</h1>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/sign-in">Back to login</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Suspense
            fallback={
              <Loader2 className="text-primary h-12 w-12 animate-spin" />
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/signin-bg.png"
          alt="Authentication Background"
          fill
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
