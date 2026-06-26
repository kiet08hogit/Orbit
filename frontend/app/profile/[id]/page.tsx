"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Loader2,
  MapPin,
  MessageSquare,
  Shield,
  Tag,
  Calendar,
  GraduationCap,
  Heart,
  AlertTriangle,
  BookOpen,
  Star,
  Pencil,
  Camera,
  Trash2,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:3000${url}`;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { getToken, isLoaded, isSignedIn, userId: currentUserId } = useAuth();
  const { user: clerkUser } = useUser();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    major: "",
    classYear: "",
    university: "",
  });

  const [isStripeLinked, setIsStripeLinked] = useState(false);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const years = [
    "Freshman",
    "Sophomore",
    "Junior",
    "Senior",
    "Graduate",
    "Faculty/Staff",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        const res = await axios.get(`http://127.0.0.1:3000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(res.data);
        setFormData({
          name: res.data.name || "",
          username: res.data.username || "",
          bio: res.data.bio || "",
          major: res.data.major || "",
          classYear: res.data.classYear || "",
          university: res.data.university || "",
        });
        setIsFollowing(res.data.isFollowing || false);
        setFollowersCount(res.data._count?.followers || 0);
        setFollowingCount(res.data._count?.following || 0);

        // Fetch Stripe status if own profile
        if (currentUserId === res.data.clerkUserId) {
          try {
            const stripeRes = await axios.get(
              `http://127.0.0.1:3000/payments/connect/status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            setIsStripeLinked(stripeRes.data.linked);
          } catch (e) {
            console.error("Failed to fetch Stripe status", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userId, isLoaded, isSignedIn, getToken, currentUserId]);

  const handleConnectStripe = async () => {
    setIsLoadingStripe(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `http://127.0.0.1:3000/payments/connect`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      setIsLoadingStripe(false);
    }
  };

  const handleFollow = async () => {
    if (!isSignedIn) return;
    setIsFollowLoading(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `http://127.0.0.1:3000/users/${userId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setIsFollowing(res.data.following);
      setFollowersCount((prev) => (res.data.following ? prev + 1 : prev - 1));
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      let avatarUrl = userProfile.avatarUrl;
      if (avatarFile && clerkUser) {
        const updatedUser = await clerkUser.setProfileImage({
          file: avatarFile,
        });
        avatarUrl = updatedUser.publicUrl;
      }

      await axios.patch(
        "http://127.0.0.1:3000/users/me",
        {
          ...formData,
          avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setUserProfile({ ...userProfile, ...formData, avatarUrl });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const token = await getToken();
      await axios.delete(`http://127.0.0.1:3000/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile((prev: any) => ({
        ...prev,
        listings: prev.listings.filter((l: any) => l.id !== listingId),
      }));
    } catch (err) {
      console.error("Failed to delete listing", err);
      alert("Failed to delete listing.");
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-card">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-card gap-4 p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Profile not found</h2>
        <Link href="/listings">
          <Button className="rounded-2xl font-bold bg-[#3252DF] hover:bg-foreground text-primary-foreground">
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const joinDate = new Date(userProfile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const listingsCount = userProfile._count?.listings || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card py-8 px-4 sm:px-6 font-sans relative overflow-hidden">
      <div className="max-w-4xl mx-auto z-10">
        {/* Back Link */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-[13px] font-bold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Marketplace
        </Link>

        <div className="flex flex-col gap-6">
          {/* Profile Header & Stats */}
          <div className="flex flex-col gap-4">
            {/* Top Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-5 md:p-7 shadow-sm border border-border flex flex-col md:flex-row gap-6 items-center md:items-start relative"
            >
              {/* Avatar */}
              <div
                className={`shrink-0 h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-zinc-50 shadow-sm overflow-hidden bg-secondary relative ${isEditing ? "cursor-pointer group" : ""}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                {avatarPreview || userProfile.avatarUrl ? (
                  <img
                    src={avatarPreview || userProfile.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400 text-4xl font-bold bg-secondary">
                    {(formData.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />

              {/* Profile Details */}
              <div className="flex-1 w-full flex flex-col gap-3">
                {isEditing ? (
                  <div className="w-full space-y-3 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Name
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="rounded-xl font-medium bg-secondary border-border focus-visible:ring-black focus-visible:ring-1 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Username
                        </label>
                        <Input
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="rounded-xl font-medium bg-secondary border-border focus-visible:ring-black focus-visible:ring-1 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Major
                        </label>
                        <Input
                          name="major"
                          value={formData.major}
                          onChange={handleChange}
                          className="rounded-xl font-medium bg-secondary border-border focus-visible:ring-black focus-visible:ring-1 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          University
                        </label>
                        <Input
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          className="rounded-xl font-medium bg-secondary border-border focus-visible:ring-black focus-visible:ring-1 h-9 text-sm"
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Class Year
                        </label>
                        <Select
                          value={formData.classYear}
                          onValueChange={(val) =>
                            setFormData({ ...formData, classYear: val || "" })
                          }
                        >
                          <SelectTrigger className="rounded-xl font-medium bg-secondary border-border focus:ring-black focus:ring-1 h-9 text-sm">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem
                                key={y}
                                value={y}
                                className="rounded-lg text-sm"
                              >
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Bio
                      </label>
                      <Textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="rounded-xl font-medium resize-none bg-secondary border-border focus-visible:ring-black focus-visible:ring-1 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h1 className="text-2xl font-black tracking-tight text-foreground">
                            {userProfile.name || "Anonymous User"}
                          </h1>
                          <div
                            className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-primary-foreground shadow-sm"
                            title="Verified UIC Student"
                          >
                            <Shield className="h-2.5 w-2.5" />
                          </div>
                        </div>
                        <p className="text-muted-foreground text-[13px] font-bold mb-3">
                          @{userProfile.username || userProfile.id.slice(0, 8)}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-3">
                          {userProfile.major && (
                            <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2.5 py-1 font-bold text-[11px] rounded-full">
                              <BookOpen className="h-3 w-3" />
                              {userProfile.major}
                            </div>
                          )}
                          {userProfile.university && (
                            <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2.5 py-1 font-bold text-[11px] rounded-full">
                              <GraduationCap className="h-3 w-3" />
                              {userProfile.university}
                            </div>
                          )}
                          {userProfile.classYear && (
                            <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2.5 py-1 font-bold text-[11px] rounded-full">
                              <GraduationCap className="h-3 w-3" />
                              {userProfile.classYear}
                            </div>
                          )}
                          <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2.5 py-1 font-bold text-[11px] rounded-full">
                            <Calendar className="h-3 w-3" />
                            Joined {joinDate}
                          </div>
                        </div>

                        <div className="text-[13px] font-medium text-muted-foreground max-w-xl">
                          {userProfile.bio ? (
                            <p className="leading-relaxed">{userProfile.bio}</p>
                          ) : (
                            <p className="italic text-zinc-400">
                              This student hasn't written a bio yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Desktop */}
                      <div className="hidden md:flex flex-col gap-2 shrink-0 min-w-[120px]">
                        {currentUserId === userProfile.clerkUserId ? (
                          <Button
                            className="rounded-full h-8 font-bold text-[13px] bg-primary hover:opacity-90 text-primary-foreground shadow-sm transition-all"
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              className="rounded-full h-8 font-bold text-[13px] bg-primary hover:opacity-90 text-primary-foreground shadow-sm transition-all flex gap-1.5"
                              onClick={() =>
                                router.push(
                                  `/chat?userId=${userProfile.clerkUserId}`,
                                )
                              }
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Message
                            </Button>
                            <Button
                              variant={isFollowing ? "outline" : "default"}
                              className={`rounded-full h-8 font-bold text-[13px] transition-all flex gap-1.5 ${!isFollowing ? "bg-primary hover:opacity-90 text-primary-foreground" : ""}`}
                              onClick={handleFollow}
                              disabled={isFollowLoading}
                            >
                              {isFollowLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isFollowing ? (
                                "Unfollow"
                              ) : (
                                "Follow"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              className="rounded-full h-8 font-bold text-[13px] text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all flex gap-1.5"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Report
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Edit Mode Save Button */}
                {isEditing && currentUserId === userProfile.clerkUserId && (
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="ghost"
                      className="rounded-full h-8 font-bold text-[13px] text-muted-foreground hover:bg-secondary"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="rounded-full h-8 font-bold text-[13px] bg-primary hover:opacity-90 text-primary-foreground shadow-sm transition-all min-w-[100px]"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                )}

                {/* Mobile Action Buttons */}
                {!isEditing && (
                  <div className="flex md:hidden flex-col gap-2 mt-3 w-full">
                    {currentUserId === userProfile.clerkUserId ? (
                      <Button
                        className="w-full rounded-full h-9 font-bold text-[13px] bg-primary hover:opacity-90 text-primary-foreground shadow-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full rounded-full h-9 font-bold text-[13px] bg-primary hover:opacity-90 text-primary-foreground shadow-sm flex gap-1.5"
                          onClick={() =>
                            router.push(
                              `/chat?userId=${userProfile.clerkUserId}`,
                            )
                          }
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Message Seller
                        </Button>
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          className={`w-full rounded-full h-9 font-bold text-[13px] transition-all flex gap-1.5 ${!isFollowing ? "bg-primary hover:opacity-90 text-primary-foreground" : ""}`}
                          onClick={handleFollow}
                          disabled={isFollowLoading}
                        >
                          {isFollowLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                          ) : isFollowing ? (
                            "Unfollow"
                          ) : (
                            "Follow"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full rounded-full h-9 font-bold text-[13px] text-muted-foreground hover:text-red-600 hover:bg-red-50 flex gap-1.5"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Report
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Horizontal Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-3xl border border-border p-4 md:px-7 md:py-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex flex-row justify-around md:justify-start gap-6 md:gap-12 w-full md:w-auto">
                <div className="flex flex-col items-center md:items-start gap-0.5">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" /> Rating
                  </span>
                  <span className="text-lg font-black text-foreground">
                    New
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start gap-0.5">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Active
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {listingsCount}
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start gap-0.5">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Followers
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {followersCount}
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start gap-0.5">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Following
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {followingCount}
                  </span>
                </div>
              </div>

              {/* Stripe Connection Section */}
              {currentUserId === userProfile.clerkUserId && (
                <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-zinc-100 pt-3 md:pt-0 md:pl-6">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="font-bold text-[12px] text-muted-foreground">
                      Seller Payouts
                    </h4>
                  </div>
                  {isStripeLinked ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-100">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </div>
                  ) : (
                    <Button
                      onClick={handleConnectStripe}
                      disabled={isLoadingStripe}
                      variant="outline"
                      className="rounded-full h-7 font-bold text-[11px] bg-card text-foreground shadow-sm transition-colors w-full md:w-auto px-3"
                    >
                      {isLoadingStripe ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin mr-1.5" />
                      ) : null}
                      Connect Bank Account
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* User's Listings Section */}
          <div className="flex flex-col gap-4 mt-2">
            <h2 className="text-lg font-black tracking-tight text-foreground px-2">
              Listings by {userProfile.name?.split(" ")[0] || "User"}
            </h2>
            {userProfile.listings && userProfile.listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userProfile.listings.map((listing: any, i: number) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/listings/${listing.id}`}
                      className="block h-full group"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col h-full bg-card rounded-[18px] border border-border shadow-sm overflow-hidden hover:-translate-y-1 transition-transform duration-300"
                      >
                        {/* Image */}
                        <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-background">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={getImageUrl(listing.images[0].url)}
                              alt={listing.title}
                              className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <Tag className="h-10 w-10 text-[#d2d2d7] z-10" />
                          )}
                          {/* Category Badge */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className="bg-card/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] uppercase font-black tracking-wider text-foreground shadow-sm">
                              {listing.category}
                            </span>
                          </div>
                          {/* Edit/Delete Button Overlay */}
                          {currentUserId === userProfile.clerkUserId && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/listings/${listing.id}/edit`);
                                }}
                                className="cursor-pointer"
                              >
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 rounded-full bg-card text-foreground shadow-sm hover:bg-secondary"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteListing(listing.id);
                                }}
                                className="cursor-pointer"
                              >
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8 rounded-full shadow-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div className="p-3 flex flex-col gap-1 bg-card">
                          <div className="font-semibold text-foreground text-[15px] leading-tight">
                            ${Number(listing.price).toFixed(2)}
                          </div>
                          <h3 className="text-muted-foreground text-[13px] font-normal leading-tight line-clamp-2">
                            {listing.title}
                          </h3>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-[2rem] border border-border p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                  <Tag className="h-8 w-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-1">
                  No active listings
                </h3>
                <p className="text-muted-foreground text-sm font-medium">
                  This student doesn't have any items for sale right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
