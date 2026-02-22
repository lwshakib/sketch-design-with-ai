"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Laptop,
  Monitor,
  Smartphone,
  Trash2,
  LogOut,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Github,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const {
    data: session,
    isPending: isSessionPending,
    refetch: refetchSession,
  } = authClient.useSession();

  // Local state for fetched data instead of reactive hooks
  const [sessions, setSessions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const router = useRouter();

  // Manual fetching logic as per user's provided example
  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res = await (authClient as any).listSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      const res = await (authClient as any).listAccounts();
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    } finally {
      setIsAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      fetchSessions();
      fetchAccounts();
    }
  }, [session]);

  if (isSessionPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setIsUpdatingName(true);
    try {
      await authClient.updateUser({
        name: name.trim(),
      });
      toast.success("Profile updated");
      refetchSession();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast.error("Please fill all fields and ensure passwords match");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (error) throw error;
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await (authClient as any).revokeSession({
        id,
      });
      toast.success("Session revoked");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleLinkAccount = async (provider: "google" | "github") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/account",
      });
    } catch (error) {
      toast.error(`Failed to link ${provider} account`);
    }
  };

  const handleUnlinkAccount = async (id: string) => {
    try {
      await (authClient as any).unlinkAccount({
        accountRecordId: id,
      });
      toast.success("Account unlinked");
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to unlink account");
    }
  };

  // Improved linked check that includes the current session's provider
  const isProviderLinked = (provider: string) => {
    // Check if the current user's initial provider matches
    if ((user as any).provider === provider) return true;
    // Check the accounts table
    return accounts?.some((acc: any) => acc.providerId === provider);
  };

  return (
    <div className="bg-background text-foreground selection:bg-primary/30 min-h-screen font-sans transition-colors duration-500">
      <header className="bg-background/80 border-border/50 sticky top-0 z-50 flex w-full items-center justify-between border-b px-6 py-2 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 py-1 text-sm font-bold transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Sidebar / Profile Info */}
          <div className="space-y-8 lg:col-span-4">
            <div className="sticky top-12">
              <div className="group relative mx-auto h-32 w-32 lg:mx-0">
                <Avatar className="border-secondary ring-border h-32 w-32 border-4 shadow-2xl ring-1 transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="bg-secondary text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-6 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user.name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
                <div className="bg-primary/10 border-primary/20 text-primary mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest">
                  <CheckCircle2 className="h-3 w-3" /> Verified Member
                </div>
              </div>

              <div className="mt-12 hidden space-y-2 lg:block">
                {["Profile", "Security", "Sessions"].map((item) => (
                  <button
                    key={item}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-all"
                    onClick={() => {
                      const el = document.getElementById(
                        item.toLowerCase().replace(" ", "-"),
                      );
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="space-y-20 pb-40 lg:col-span-8">
            {/* Profile Section */}
            <section id="profile" className="scroll-mt-12 space-y-8">
              <div className="border-border border-b pb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Profile Settings
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Manage your public information and connected accounts.
                </p>
              </div>

              <div className="space-y-10">
                <div className="grid gap-3">
                  <Label
                    htmlFor="name"
                    className="text-muted-foreground text-xs font-bold"
                  >
                    Display Name
                  </Label>
                  <div className="flex gap-4">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="border-border bg-secondary/50 text-foreground focus-visible:ring-primary/50 h-11 max-w-md rounded-xl"
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={isUpdatingName || name === user.name}
                      variant="default"
                      className="hover:shadow-primary/20 h-11 rounded-xl px-6 font-bold shadow-lg transition-all"
                    >
                      {isUpdatingName ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs font-bold">
                      Connected Accounts
                    </Label>
                    {isAccountsLoading && (
                      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                    )}
                  </div>

                  <div className="grid gap-3">
                    {isAccountsLoading ? (
                      <div className="grid gap-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="bg-secondary/30 border-border/60 h-20 animate-pulse rounded-2xl border"
                          />
                        ))}
                      </div>
                    ) : (
                      ["google", "github"].map((provider) => {
                        const isLinked = isProviderLinked(provider);
                        return (
                          <div
                            key={provider}
                            className="bg-secondary/30 border-border/60 hover:bg-secondary/50 flex items-center justify-between rounded-2xl border p-4 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-background border-border flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm">
                                {provider === "google" ? (
                                  <img
                                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                                    alt="google"
                                    className="h-5 w-5"
                                  />
                                ) : (
                                  <Github className="text-foreground h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="text-foreground text-xs font-bold capitalize">
                                  {provider}
                                </p>
                                <p className="text-muted-foreground text-[10px] font-medium">
                                  {isLinked
                                    ? "Connected and verified"
                                    : "Not connected"}
                                </p>
                              </div>
                            </div>
                            {isLinked ? (
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-500">
                                  Active
                                </span>
                                {accounts?.some(
                                  (a: any) => a.providerId === provider,
                                ) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const acc = accounts?.find(
                                        (a: any) => a.providerId === provider,
                                      );
                                      if (acc) handleUnlinkAccount(acc.id);
                                    }}
                                    className="text-destructive hover:bg-destructive/10 h-8 rounded-lg px-3 text-[10px] font-bold"
                                  >
                                    Unlink
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleLinkAccount(provider as any)
                                }
                                className="border-border bg-background hover:bg-secondary h-8 rounded-lg px-4 text-[10px] font-bold"
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section id="security" className="scroll-mt-12 space-y-8">
              <div className="border-border border-b pb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Account Security
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Change your password and secure your identity.
                </p>
              </div>

              <div className="max-w-md space-y-5">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={
                    isUpdatingPassword || !currentPassword || !newPassword
                  }
                  className="hover:shadow-primary/20 mt-2 h-11 w-full rounded-xl font-bold shadow-lg transition-all"
                >
                  {isUpdatingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </div>
            </section>

            {/* Sessions Section */}
            <section id="sessions" className="scroll-mt-12 space-y-8">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                  Active Sessions
                  {isSessionsLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  )}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Devices that are currently logged into your account.
                </p>
              </div>

              <div className="grid gap-3">
                {isSessionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-800" />
                  </div>
                ) : sessions.length > 0 ? (
                  sessions.map((s: any) => (
                    <div
                      key={s.id}
                      className="border-border/60 bg-secondary/30 group hover:bg-secondary/50 flex items-center justify-between rounded-2xl border p-5 backdrop-blur-sm transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="bg-background border-border flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm">
                          {s.userAgent?.toLowerCase().includes("mobile") ? (
                            <Smartphone className="text-muted-foreground h-6 w-6" />
                          ) : (
                            <Laptop className="text-muted-foreground h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-foreground text-sm font-bold">
                              {s.userAgent?.split(")")[0]?.split("(")[1] ||
                                "Modern Browser"}
                            </p>
                            {s.id === session.session.id && (
                              <span className="bg-primary/10 text-primary border-primary/20 rounded-full border px-2 py-0.5 text-[9px] font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[10px] font-medium text-zinc-500 opacity-80">
                            {s.ipAddress || "Active Connection"} • Last active
                            recently
                          </p>
                        </div>
                      </div>
                      {s.id !== session.session.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={revokingId === s.id}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-4"
                        >
                          {revokingId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                          )}
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900">
                      <Monitor className="h-6 w-6 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-400">
                      No active sessions found
                    </h3>
                    <p className="mt-1 max-w-[200px] text-xs text-zinc-600">
                      Only the current session is currently registered in our
                      security logs.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
