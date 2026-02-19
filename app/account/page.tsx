"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Github
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
  const { data: session, isPending: isSessionPending, refetch: refetchSession } = authClient.useSession();
  
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
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setIsUpdatingName(true);
    try {
      await authClient.updateUser({
        name: name.trim()
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
        revokeOtherSessions: false
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
        id
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
        accountRecordId: id
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-500">
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-2 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all group py-1"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar / Profile Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-12">
              <div className="relative group w-32 h-32 mx-auto lg:mx-0">
                <Avatar className="h-32 w-32 border-4 border-secondary shadow-2xl ring-1 ring-border transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="text-3xl font-bold bg-secondary">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-6 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold tracking-widest text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Verified Member
                </div>
              </div>

              <div className="mt-12 space-y-2 hidden lg:block">
                  {['Profile', 'Security', 'Sessions'].map((item) => (
                      <button 
                        key={item}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all font-medium"
                        onClick={() => {
                            const el = document.getElementById(item.toLowerCase().replace(' ', '-'));
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                         {item}
                      </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="lg:col-span-8 space-y-20 pb-40">
            {/* Profile Section */}
            <section id="profile" className="space-y-8 scroll-mt-12">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-semibold tracking-tight">Profile Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage your public information and connected accounts.</p>
              </div>

              <div className="space-y-10">
                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-muted-foreground text-xs font-bold">Display Name</Label>
                  <div className="flex gap-4">
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="max-w-md border-border bg-secondary/50 text-foreground focus-visible:ring-primary/50 h-11 rounded-xl"
                    />
                    <Button 
                      onClick={handleUpdateName} 
                      disabled={isUpdatingName || name === user.name}
                      variant="default"
                      className="font-bold h-11 px-6 transition-all rounded-xl shadow-lg hover:shadow-primary/20"
                    >
                      {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs font-bold">Connected Accounts</Label>
                    {isAccountsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  
                  <div className="grid gap-3">
                      {isAccountsLoading ? (
                          <div className="grid gap-3">
                              {[1, 2].map((i) => (
                                  <div key={i} className="h-20 bg-secondary/30 border border-border/60 rounded-2xl animate-pulse" />
                              ))}
                          </div>
                      ) : (
                          ['google', 'github'].map((provider) => {
                              const isLinked = isProviderLinked(provider);
                              return (
                                  <div key={provider} className="flex items-center justify-between bg-secondary/30 border border-border/60 rounded-2xl p-4 transition-all hover:bg-secondary/50">
                                      <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 bg-background rounded-xl flex items-center justify-center border border-border shadow-sm">
                                              {provider === 'google' ? (
                                                  <img 
                                                    src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                                    alt="google" 
                                                    className="h-5 w-5"
                                                  />
                                              ) : (
                                                  <Github className="h-5 w-5 text-foreground" />
                                              )}
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold capitalize text-foreground">{provider}</p>
                                              <p className="text-[10px] text-muted-foreground font-medium">
                                                  {isLinked ? "Connected and verified" : "Not connected"}
                                              </p>
                                          </div>
                                      </div>
                                      {isLinked ? (
                                          <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                                              {accounts?.some((a: any) => a.providerId === provider) && (
                                                  <Button 
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const acc = accounts?.find((a: any) => a.providerId === provider);
                                                        if (acc) handleUnlinkAccount(acc.id);
                                                    }}
                                                    className="text-[10px] text-destructive font-bold hover:bg-destructive/10 px-3 h-8 rounded-lg"
                                                  >
                                                    Unlink
                                                  </Button>
                                              )}
                                          </div>
                                      ) : (
                                          <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleLinkAccount(provider as any)}
                                            className="text-[10px] font-bold border-border bg-background hover:bg-secondary px-4 h-8 rounded-lg"
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
            <section id="security" className="space-y-8 scroll-mt-12">
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-semibold tracking-tight">Account Security</h2>
                <p className="text-xs text-muted-foreground mt-1">Change your password and secure your identity.</p>
              </div>

              <div className="max-w-md space-y-5">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">Current Password</Label>
                  <Input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-[10px] font-bold">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-border bg-secondary/50 h-11 rounded-xl" 
                  />
                </div>
                <Button 
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="w-full font-bold h-11 transition-all mt-2 rounded-xl shadow-lg hover:shadow-primary/20"
                >
                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                </Button>
              </div>
            </section>

            {/* Sessions Section */}
            <section id="sessions" className="space-y-8 scroll-mt-12">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-lg font-semibold flex items-center gap-3 tracking-tight">
                  Active Sessions
                  {isSessionsLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Devices that are currently logged into your account.</p>
              </div>
              
              <div className="grid gap-3">
                {isSessionsLoading ? (
                    <div className="py-10 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-800" />
                    </div>
                ) : sessions.length > 0 ? sessions.map((s: any) => (
                  <div 
                    key={s.id} 
                    className="flex items-center justify-between p-5 rounded-2xl border border-border/60 bg-secondary/30 backdrop-blur-sm group transition-all hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border shadow-sm">
                        {s.userAgent?.toLowerCase().includes("mobile") ? (
                          <Smartphone className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Laptop className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-foreground">
                            {s.userAgent?.split(')')[0]?.split('(')[1] || "Modern Browser"}
                          </p>
                          {s.id === session.session.id && (
                            <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium opacity-80">
                          {s.ipAddress || "Active Connection"} • Last active recently
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
                        {revokingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                        Revoke
                      </Button>
                    )}
                  </div>
                )) : (
                    <div className="p-12 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center bg-zinc-900/20">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
                            <Monitor className="h-6 w-6 text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400">No active sessions found</h3>
                        <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">Only the current session is currently registered in our security logs.</p>
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
