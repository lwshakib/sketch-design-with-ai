"use client";

import { useEffect, useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { uploadFileToS3 } from "@/lib/s3-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  Laptop,
  Monitor,
  Smartphone,
  LogOut,
  Loader2,
  CheckCircle2,
  Github,
  Camera,
  ShieldCheck,
  Mail,
  Lock,
  Globe,
  ChevronLeft,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AccountPage() {
  const {
    data: session,
    isPending: isSessionPending,
    refetch: refetchSession,
  } = authClient.useSession();
  const router = useRouter();

  // Local state for fetched data
  const [sessions, setSessions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Profile data states
  const [name, setName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [showNameCheck, setShowNameCheck] = useState(false);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  // Avatar upload and resolution states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch session devices
  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res = await (authClient as any).listSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  // Fetch connected accounts
  const fetchAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      const res = await (authClient as any).listAccounts();
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setIsAccountsLoading(false);
    }
  };



  // Sync session details when loaded
  useEffect(() => {
    if (session?.user) {
      Promise.resolve().then(() => {
        setName(session.user.name || "");
        fetchSessions();
        fetchAccounts();
      });
    }
  }, [session]);

  // Resolve relative S3 image path dynamically to a secure signed URL
  useEffect(() => {
    const resolveAvatar = async () => {
      if (!session?.user?.image) {
        setResolvedAvatarUrl("");
        return;
      }
      if (session.user.image.startsWith("http")) {
        setResolvedAvatarUrl(session.user.image);
        return;
      }
      try {
        const res = await fetch("/api/s3/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: [session.user.image] }),
        });
        if (res.ok) {
          const { urls } = await res.json();
          if (urls && urls[0]) {
            setResolvedAvatarUrl(urls[0]);
          }
        }
      } catch (err) {
        console.error("Failed to resolve avatar signed URL:", err);
      }
    };
    resolveAvatar();
  }, [session?.user?.image]);

  if (isSessionPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!session) {
    router.replace("/sign-in");
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

  // Handle Display Name modification
  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setIsUpdatingName(true);
    try {
      await authClient.updateUser({
        name: name.trim(),
      });
      toast.success("Display name updated successfully");
      refetchSession();
    } catch (err) {
      toast.error("Failed to update profile name");
    } finally {
      setIsUpdatingName(false);
      setShowNameCheck(true);
      setTimeout(() => setShowNameCheck(false), 2000);
    }
  };

  // Handle Password Modification
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast.error("Please fill all fields and confirm passwords match");
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
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
      setShowPasswordCheck(true);
      setTimeout(() => setShowPasswordCheck(false), 2000);
    }
  };

  // Revoke device session
  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await (authClient as any).revokeSession({
        id,
      });
      toast.success("Active session revoked successfully");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  // Link OAuth provider
  const handleLinkAccount = async (provider: "google" | "github") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/account",
      });
    } catch (err) {
      toast.error(`Failed to connect ${provider} account`);
    }
  };

  // Unlink OAuth provider
  const handleUnlinkAccount = async (id: string) => {
    try {
      await (authClient as any).unlinkAccount({
        accountRecordId: id,
      });
      toast.success("Social account unlinked successfully");
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to disconnect social account");
    }
  };

  // Check if provider is active on the account
  const isProviderLinked = (provider: string) => {
    if ((user as any).provider === provider) return true;
    return accounts?.some((acc: any) => acc.providerId === provider);
  };

  // S3 Avatar upload flow
  const processAvatarUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    const toastId = toast.loading("Uploading your new avatar...");
    try {
      // Step 1: Upload to S3 directly via presigned-url
      const { path } = await uploadFileToS3(file, "avatars");

      // Step 2: Update database profile picture relative path
      await authClient.updateUser({
        image: path,
      });

      toast.success("Avatar updated successfully!", { id: toastId });
      refetchSession();
    } catch (err) {
      console.error("Avatar S3 upload error:", err);
      toast.error("Avatar upload failed. Please try again.", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processAvatarUpload(files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processAvatarUpload(files[0]);
    }
  };

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 min-h-screen font-sans antialiased transition-colors duration-300">
      {/* Dynamic Glassmorphic Navigation Header matching landing page */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-6 bg-background/50 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        {/* Modern Settings Heading */}
        <div className="mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group mb-4 w-fit animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <ChevronLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Manage your personal profile parameters, connected security tokens, social login connections, and active device sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR COLUMN: Profile Spotlight & Image Management */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="overflow-hidden border border-border/80 rounded-3xl bg-card/60 shadow-xl backdrop-blur-xl ring-1 ring-white/5 dark:ring-white/0">
              <div className="pt-10 pb-8 flex flex-col items-center text-center px-6">
                
                {/* Drag & Drop S3 Avatar Container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative cursor-pointer size-36 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300",
                    isDragging 
                      ? "border-primary bg-primary/10 scale-105" 
                      : "border-border hover:border-primary/60 hover:shadow-2xl"
                  )}
                >
                  <Avatar className="size-[136px] border border-border/50 ring-1 ring-border/20 shadow-md">
                    <AvatarImage src={resolvedAvatarUrl} alt={user.name || ""} className="object-cover" />
                    <AvatarFallback className="bg-secondary text-3xl font-extrabold tracking-wider text-muted-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Glassmorphic Overlay Hover Effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]",
                    isUploadingAvatar && "opacity-100 bg-black/75 cursor-wait"
                  )}>
                    {isUploadingAvatar ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-7 animate-spin text-primary-foreground" />
                        <span className="text-[10px] font-bold text-white tracking-widest uppercase animate-pulse">Uploading</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="size-6 text-white mb-1 transition-transform group-hover:scale-110 duration-200" />
                        <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Change photo</span>
                        <span className="text-[8px] text-white/60 mt-0.5">Drag & Drop OK</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Invisible input file selector */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  disabled={isUploadingAvatar}
                />

                <div className="space-y-1.5 w-full mt-6 px-2 overflow-hidden">
                  <h2 className="text-xl font-bold tracking-tight text-foreground truncate" title={user.name}>
                    {user.name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate" title={user.email}>
                    {user.email}
                  </p>
                  
                  <div className="pt-4 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-500">
                      <ShieldCheck className="mr-1.5 size-3.5" />
                      Active Account
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/20 border border-border/60 border-dashed rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Profile Integrity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your profile parameters and avatar are bound to Sketch design databases. S3 uploads are verified and hashed securely.
              </p>
            </div>
          </div>

          {/* MAIN CONFIGURATION LAYER: Forms, Sessions, Connected Socials */}
          <div className="lg:col-span-8 space-y-8 min-w-0">
            
            {/* General Profile Info Card */}
            <div className="border border-border/80 rounded-3xl bg-card shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Settings className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Display Configuration</h2>
                    <p className="text-xs text-muted-foreground">Adjust how your profile appears to others across dynamic work sessions.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="max-w-md h-11 rounded-xl bg-background border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2 opacity-80 pt-2">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Email Address</Label>
                    <div className="flex items-center gap-3 text-sm font-medium bg-muted/60 p-3 rounded-xl border border-border/40 max-w-md">
                      <Mail className="size-4.5 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic pl-1">
                      Email updates must go through verification security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border-t border-border/50 px-6 py-4 flex items-center justify-start">
                <Button
                  onClick={handleUpdateName}
                  disabled={isUpdatingName || name.trim() === user.name || showNameCheck}
                  className="rounded-xl font-bold px-6 h-10 shadow-sm transition-all duration-200 hover:scale-[1.01]"
                >
                  {isUpdatingName ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : showNameCheck ? (
                    <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Standard Credentials Security Card */}
            <div className="border border-border/80 rounded-3xl bg-card shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Lock className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Security & Credentials</h2>
                    <p className="text-xs text-muted-foreground">Modify password keys to prevent unauthorized dashboard logins.</p>
                  </div>
                </div>

                <div className="max-w-md space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl bg-background border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl bg-background border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl bg-background border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border-t border-border/50 px-6 py-4 flex items-center justify-start">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={
                    isUpdatingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || showPasswordCheck
                  }
                  className="rounded-xl font-bold px-6 h-10 shadow-sm transition-all duration-200 hover:scale-[1.01]"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : showPasswordCheck ? (
                    <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  Update Password
                </Button>
              </div>
            </div>

            {/* Social Authentications Card */}
            <div className="border border-border/80 rounded-3xl bg-card shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Globe className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Connected Accounts</h2>
                    <p className="text-xs text-muted-foreground">Manage connected identity platforms used for swift single sign-on access.</p>
                  </div>
                </div>

                {isAccountsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {/* Google OAuth Provider Row */}
                    <div className="flex items-center justify-between p-4 border border-border/80 rounded-2xl hover:bg-secondary/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-secondary/80 ring-1 ring-border group-hover:scale-105 transition-transform duration-200">
                          <Image
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            width={22}
                            height={22}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Google SSO</p>
                          <p className="text-xs text-muted-foreground">Social Authentication Provider</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isProviderLinked("google") ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              Connected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg px-3"
                              onClick={() => {
                                const acc = accounts.find((a) => a.providerId === "google");
                                if (acc) handleUnlinkAccount(acc.id);
                              }}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs font-bold rounded-lg px-4"
                            onClick={() => handleLinkAccount("google")}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* GitHub OAuth Provider Row */}
                    <div className="flex items-center justify-between p-4 border border-border/80 rounded-2xl hover:bg-secondary/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-secondary/80 ring-1 ring-border group-hover:scale-105 transition-transform duration-200">
                          <Github className="size-[22px] text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">GitHub OAuth</p>
                          <p className="text-xs text-muted-foreground">Developer Authentication Provider</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isProviderLinked("github") ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              Connected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg px-3"
                              onClick={() => {
                                const acc = accounts.find((a) => a.providerId === "github");
                                if (acc) handleUnlinkAccount(acc.id);
                              }}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs font-bold rounded-lg px-4"
                            onClick={() => handleLinkAccount("github")}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Standard Email & Password Info */}
                    <div className="flex items-center justify-between p-4 border border-border/50 border-dashed rounded-2xl bg-muted/20 opacity-80">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-background border">
                          <Mail className="size-[22px] text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Standard credentials</p>
                          <p className="text-xs text-muted-foreground">Signed up with email and secure password</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border px-2.5 py-1 rounded-lg">
                        Primary
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Sessions & Security Logs Card */}
            <div className="border border-border/80 rounded-3xl bg-card shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Monitor className="size-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Active Devices</h2>
                      <p className="text-xs text-muted-foreground">Active device sessions dynamically authenticated to your profile logs.</p>
                    </div>
                  </div>
                  {isSessionsLoading && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {isSessionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((sess) => {
                      const isMobile = sess.userAgent?.toLowerCase().includes("mobile") || sess.userAgent?.includes("Mobi");
                      return (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between gap-4 p-4 border border-border/80 rounded-2xl bg-card/40 hover:bg-secondary/10 hover:shadow-sm transition-all duration-150"
                        >
                          <div className="flex items-center gap-4 overflow-hidden min-w-0">
                            <div className="p-2.5 bg-muted border rounded-xl shrink-0">
                              {isMobile ? (
                                <Smartphone className="size-5 text-muted-foreground" />
                              ) : (
                                <Laptop className="size-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-sm font-bold truncate flex items-center gap-2">
                                {sess.userAgent?.split(")")[0]?.split("(")[1] || "Secure Browser"}
                                {sess.id === session.session.id && (
                                  <span className="shrink-0 text-[8px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">
                                {sess.ipAddress || "Unidentified IP"} • Last active recently
                              </p>
                            </div>
                          </div>

                          {sess.id !== session.session.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 rounded-xl px-3 font-bold h-8 gap-1.5 shrink-0"
                              onClick={() => handleRevokeSession(sess.id)}
                              disabled={revokingId === sess.id}
                            >
                              {revokingId === sess.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <>
                                  <LogOut className="size-3.5" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
