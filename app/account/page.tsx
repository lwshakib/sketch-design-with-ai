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
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await (authClient as any).deleteUser();
      toast.success("Account deleted");
      router.push("/sign-in");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 font-sans">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Back Button */}
        <Link 
          href="/" 
          className="mb-12 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar / Profile Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-12">
              <div className="relative group w-32 h-32 mx-auto lg:mx-0">
                <Avatar className="h-32 w-32 border-4 border-zinc-900 shadow-2xl ring-1 ring-zinc-800 transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="text-3xl font-bold bg-zinc-900">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-6 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  <CheckCircle2 className="h-3 w-3" /> Verified Member
                </div>
              </div>

              <div className="mt-12 space-y-2 hidden lg:block">
                  {['Profile', 'Security', 'Sessions', 'Danger Zone'].map((item) => (
                      <button 
                        key={item}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all font-medium"
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
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">Profile Settings</h2>
                <p className="text-xs text-zinc-500 mt-1">Manage your public information and connected accounts.</p>
              </div>

              <div className="space-y-10">
                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Display Name</Label>
                  <div className="flex gap-4">
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="max-w-md border-zinc-800 bg-zinc-900/40 text-white focus-visible:ring-indigo-500/50 h-11 rounded-xl"
                    />
                    <Button 
                      onClick={handleUpdateName} 
                      disabled={isUpdatingName || name === user.name}
                      className="bg-zinc-100 text-zinc-950 hover:bg-white font-bold h-11 px-6 transition-all rounded-xl"
                    >
                      {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Connected Accounts</Label>
                    {isAccountsLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                  </div>
                  
                  <div className="grid gap-3">
                      {isAccountsLoading ? (
                          <div className="grid gap-3">
                              {[1, 2].map((i) => (
                                  <div key={i} className="h-20 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl animate-pulse" />
                              ))}
                          </div>
                      ) : (
                          ['google', 'github'].map((provider) => {
                              const isLinked = isProviderLinked(provider);
                              return (
                                  <div key={provider} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 transition-all hover:bg-zinc-900/60">
                                      <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 shadow-inner">
                                              <img 
                                                src={provider === 'google' ? "https://www.svgrepo.com/show/475656/google-color.svg" : "https://www.svgrepo.com/show/512317/github-142.svg"} 
                                                alt={provider} 
                                                className="h-5 w-5"
                                              />
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold capitalize text-zinc-200">{provider}</p>
                                              <p className="text-[10px] text-zinc-500 font-medium">
                                                  {isLinked ? "Connected and verified" : "Not connected"}
                                              </p>
                                          </div>
                                      </div>
                                      {isLinked ? (
                                          <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                                              {accounts?.some((a: any) => a.providerId === provider) && (
                                                  <Button 
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const acc = accounts?.find((a: any) => a.providerId === provider);
                                                        if (acc) handleUnlinkAccount(acc.id);
                                                    }}
                                                    className="text-[10px] text-red-500 font-bold hover:bg-red-500/10 px-3 h-8 rounded-lg"
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
                                            className="text-[10px] text-zinc-300 font-bold border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-4 h-8 rounded-lg"
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
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">Account Security</h2>
                <p className="text-xs text-zinc-500 mt-1">Change your password and secure your identity.</p>
              </div>

              <div className="max-w-md space-y-5">
                <div className="grid gap-2">
                  <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Current Password</Label>
                  <Input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="border-zinc-800 bg-zinc-900/40 h-11 rounded-xl" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-zinc-800 bg-zinc-900/40 h-11 rounded-xl" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-zinc-800 bg-zinc-900/40 h-11 rounded-xl" 
                  />
                </div>
                <Button 
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="w-full bg-zinc-100 text-zinc-950 hover:bg-white font-bold h-11 transition-all mt-2 rounded-xl"
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
                    className="flex items-center justify-between p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm group transition-all hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-inner">
                        {s.userAgent?.toLowerCase().includes("mobile") ? (
                          <Smartphone className="h-6 w-6 text-zinc-500" />
                        ) : (
                          <Laptop className="h-6 w-6 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-zinc-200">
                            {s.userAgent?.split(')')[0]?.split('(')[1] || "Modern Browser"}
                          </p>
                          {s.id === session.session.id && (
                            <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-500/20">
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
                        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl px-4"
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

            {/* Danger Zone */}
            <section id="danger-zone" className="space-y-8 scroll-mt-12">
              <div className="border-b border-red-900/40 pb-4">
                <h2 className="text-lg font-semibold text-red-500 tracking-tight">Danger Zone</h2>
                <p className="text-xs text-red-500/60 mt-1">Actions in this zone are irreversible and critical.</p>
              </div>
              
              <div className="relative overflow-hidden rounded-[2rem] border border-red-900/20 bg-red-950/5 group transition-all">
                <div className="p-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <h3 className="text-lg font-bold text-red-100 tracking-tight">Terminate Identity</h3>
                      </div>
                      <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
                        Deleting your account will permanently remove all your design projects, saved themes, and generated assets. This action is irreversible and instant.
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 font-black px-10 h-14 transition-all rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldAlert className="mr-2 h-5 w-5" />
                      Terminate Identity
                    </Button>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-red-500/5 blur-3xl rounded-full" />
              </div>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 rounded-[2rem] max-w-md p-8">
                  <AlertDialogHeader className="space-y-4 text-center sm:text-left">
                    <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto sm:mx-0 border border-red-500/20">
                      <AlertTriangle className="h-7 w-7 text-red-500" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-white tracking-tight">
                      Confirm Account Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-500 leading-relaxed text-sm">
                      Are you absolutely sure? This will permanently wipe your entire workspace and all design history. There is no way to recover your data once this process starts.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
                    <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl h-11 flex-1 font-bold">
                      Keep Account
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAccount();
                      }}
                      disabled={isDeletingAccount}
                      className="bg-red-600 text-white hover:bg-red-500 rounded-xl h-11 flex-1 font-bold"
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Permanently Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
