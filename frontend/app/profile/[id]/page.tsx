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
  BadgeCheck,
  User,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [reviewsData, setReviewsData] = useState<any>(null);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isLoadingFollowData, setIsLoadingFollowData] = useState(false);

  const [hasChatted, setHasChatted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);



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
        setHasChatted(res.data.hasChatted || false);

        // Fetch reviews
        try {
          const reviewsRes = await axios.get(`http://127.0.0.1:3000/reviews/user/${res.data.id}`);
          setReviewsData(reviewsRes.data);
        } catch (e) {
          console.error("Failed to load reviews");
        }

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

  const handleRemoveFollower = async (followerId: string) => {
    try {
      const token = await getToken();
      await axios.delete(`http://127.0.0.1:3000/users/${followerId}/follower`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowersList(prev => prev.filter(u => u.id !== followerId));
      setFollowersCount(prev => prev - 1);
    } catch (err) {
      console.error("Failed to remove follower", err);
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      const token = await getToken();
      await axios.post(`http://127.0.0.1:3000/users/${targetId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowingList(prev => prev.filter(u => u.id !== targetId));
      setFollowingCount(prev => prev - 1);
    } catch (err) {
      console.error("Failed to unfollow user", err);
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

      setUserProfile((prev: any) => ({ ...prev, ...formData }));
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const token = await getToken();
      await axios.post(
        "http://127.0.0.1:3000/reviews",
        {
          revieweeId: userProfile.id,
          rating: reviewRating,
          comment: reviewComment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment("");
      
      // Refresh reviews
      const reviewsRes = await axios.get(`http://127.0.0.1:3000/reviews/user/${userProfile.id}`);
      setReviewsData(reviewsRes.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchFollowData = async (type: 'followers' | 'following') => {
    if (!userProfile?.id && !userId) return;
    setIsLoadingFollowData(true);
    try {
      const token = await getToken();
      const res = await axios.get(`http://127.0.0.1:3000/users/${userProfile?.id || userId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (type === 'followers') setFollowersList(res.data);
      else setFollowingList(res.data);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load ${type}`);
    } finally {
      setIsLoadingFollowData(false);
    }
  };

  const handleOpenFollowers = () => {
    setShowFollowers(true);
    if (followersList.length === 0) fetchFollowData('followers');
  };

  const handleOpenFollowing = () => {
    setShowFollowing(true);
    if (followingList.length === 0) fetchFollowData('following');
  };

  const handleSendVerification = async () => {
    try {
      setIsVerifying(true);
      const token = await getToken();
      await axios.post(
        `http://127.0.0.1:3000/users/verify-edu/send`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCodeSent(true);
      toast.success("Verification code sent to your email.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send code. Make sure your account email is a .edu email.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsVerifying(true);
      const token = await getToken();
      await axios.post(
        `http://127.0.0.1:3000/users/verify-edu/verify`,
        { code: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Email verified successfully!");
      setUserProfile((prev: any) => ({ ...prev, isEduVerified: true }));
      setCodeSent(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify code.");
    } finally {
      setIsVerifying(false);
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
  const isOwnProfile = currentUserId === userProfile.clerkUserId;

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
                    src={avatarPreview || userProfile.avatarUrl || undefined}
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
                    {/* Edu Verification Section */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        .edu Email Verification
                        {userProfile?.isEduVerified && (
                          <BadgeCheck className="h-5 w-5 text-blue-500" />
                        )}
                      </h3>
                      {userProfile?.isEduVerified ? (
                        <p className="text-sm text-green-600 font-medium bg-green-500/10 p-3 rounded-lg border border-green-500/20 inline-block">
                          Your account is fully verified.
                        </p>
                      ) : (
                        <div className="space-y-4 max-w-[400px]">
                          <p className="text-[12px] text-muted-foreground">
                            Verify your student or staff status to unlock the verified
                            badge on your profile. We will send a code to your registered account email.
                          </p>
                          {!codeSent ? (
                            <Button
                              onClick={handleSendVerification}
                              disabled={isVerifying}
                              className="w-full sm:w-auto text-xs h-8"
                            >
                              {isVerifying ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              ) : null}
                              Send Code
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="bg-secondary h-8 text-xs max-w-[150px]"
                                maxLength={6}
                              />
                              <Button
                                onClick={handleVerifyCode}
                                disabled={isVerifying || verificationCode.length !== 6}
                                className="h-8 text-xs"
                              >
                                {isVerifying ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Verify"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                          {userProfile?.name || "Orbit User"}
                          {userProfile?.isEduVerified && (
                            <BadgeCheck className="h-6 w-6 text-blue-500 shrink-0" />
                          )}
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                          @{userProfile?.username || "username"}
                        </p>
                        {reviewsData && reviewsData.totalCount > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-sm font-medium text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{reviewsData.averageRating.toFixed(1)}</span>
                            <span className="text-muted-foreground ml-1">({reviewsData.totalCount} reviews)</span>
                          </div>
                        )}

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
                                "Followed"
                              ) : (
                                "Follow"
                              )}
                            </Button>
                            {hasChatted && (
                              <Button
                                variant="outline"
                                className="rounded-full h-8 font-bold text-[13px] text-amber-500 hover:text-amber-600 hover:bg-amber-50 border-amber-200 transition-all flex gap-1.5"
                                onClick={() => setShowReviewModal(true)}
                              >
                                <Star className="h-3.5 w-3.5" />
                                Leave a Review
                              </Button>
                            )}
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
                    {reviewsData && reviewsData.totalCount > 0
                      ? reviewsData.averageRating.toFixed(1)
                      : "New"}
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
                <button onClick={handleOpenFollowers} className="flex flex-col items-center md:items-start gap-0.5 hover:opacity-70 transition-opacity">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Followers
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {followersCount}
                  </span>
                </button>
                <button onClick={handleOpenFollowing} className="flex flex-col items-center md:items-start gap-0.5 hover:opacity-70 transition-opacity">
                  <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Following
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {followingCount}
                  </span>
                </button>
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
              <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[18px] border border-border border-dashed">
                <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold text-foreground">
                  No listings yet
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
                  When {userProfile.name?.split(" ")[0] || "this user"} posts
                  items for sale, they will appear here.
                </p>
              </div>
            )}
          </div>

          {/* User's Reviews Section */}
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="text-lg font-black tracking-tight text-foreground px-2">
              Reviews ({reviewsData?.totalCount || 0})
            </h2>
            {reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviewsData.reviews.map((review: any) => (
                  <div key={review.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {review.reviewer.avatarUrl ? (
                        <img
                          src={getImageUrl(review.reviewer.avatarUrl)}
                          alt="Reviewer"
                          className="h-10 w-10 rounded-full object-cover bg-secondary"
                        />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center text-zinc-400 text-lg font-bold bg-secondary rounded-full shrink-0">
                          {(review.reviewer.name || review.reviewer.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{review.reviewer.name || review.reviewer.username}</h4>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[18px] border border-border border-dashed">
                <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold text-foreground">
                  No reviews yet
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
                  {userProfile.name?.split(" ")[0] || "This user"} hasn't received any reviews.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center font-bold">Followers</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-4 flex-1">
            {isLoadingFollowData ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : followersList.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No followers yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {followersList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 hover:bg-secondary/50 p-2 rounded-xl transition-colors">
                    <Link href={`/profile/${user.clerkUserId || user.id}`} onClick={() => setShowFollowers(false)} className="flex items-center gap-3 flex-1">
                      {user.avatarUrl ? (
                        <img src={getImageUrl(user.avatarUrl)} alt={user.name} className="h-10 w-10 rounded-full object-cover bg-secondary shrink-0" />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center text-zinc-400 text-lg font-bold bg-secondary rounded-full shrink-0">
                          {(user.name || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{user.name || user.username}</span>
                          {user.isEduVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </Link>
                    {isOwnProfile && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-bold px-4 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveFollower(user.id);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center font-bold">Following</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto p-4 flex-1">
            {isLoadingFollowData ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : followingList.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Not following anyone yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {followingList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 hover:bg-secondary/50 p-2 rounded-xl transition-colors">
                    <Link href={`/profile/${user.clerkUserId || user.id}`} onClick={() => setShowFollowing(false)} className="flex items-center gap-3 flex-1">
                      {user.avatarUrl ? (
                        <img src={getImageUrl(user.avatarUrl)} alt={user.name} className="h-10 w-10 rounded-full object-cover bg-secondary shrink-0" />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center text-zinc-400 text-lg font-bold bg-secondary rounded-full shrink-0">
                          {(user.name || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{user.name || user.username}</span>
                          {user.isEduVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </Link>
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold px-4 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          handleUnfollow(user.id);
                        }}
                      >
                        Following
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Leave Review Dialog */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-background rounded-3xl overflow-hidden border-border p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold text-center">Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Rating</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Comment (Optional)</span>
              <Textarea
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="resize-none h-24 rounded-xl bg-secondary/50 border-transparent focus-visible:ring-1"
              />
            </div>
            <Button
              className="w-full rounded-xl h-11 font-bold"
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewRating === 0}
            >
              {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
