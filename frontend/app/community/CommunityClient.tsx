"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  MessageCircle,
  MoreHorizontal,
  Heart,
  Plus,
  Image as ImageIcon,
  Loader2,
  X,
  Search,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The PostType enum from Prisma
type PostType = "DISCUSSION" | "EVENT" | "CHECK_IN" | "LOOKING_FOR";

interface Post {
  id: string;
  content: string;
  postType: PostType;
  imageUrls?: string[];
  createdAt: string;
  author: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    clerkUserId?: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  likes?: { userId: string }[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

// Format date nicely e.g., "May 21" or "2h ago"
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  if (diffInMins < 60) return `${diffInMins || 1}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function CommunityClient({ initialPosts }: { initialPosts: Post[] }) {
  const {
    getToken,
    isLoaded,
    isSignedIn,
    userId: currentAuthUserId,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<"COMMUNITY" | "FOLLOWING">(
    "COMMUNITY",
  );
  const [activeFilter, setActiveFilter] = useState<"ALL" | PostType>("ALL");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posts, setPosts] = useState<Post[]>(() => {
    const seen = new Set<string>();
    return initialPosts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });
  const [isLoading, setIsLoading] = useState(false);
  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null);

  // Comments State
  const [activePostForComments, setActivePostForComments] = useState<
    string | null
  >(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Search Users State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const token = await getToken();
        const res = await axios.get(
          `http://127.0.0.1:3000/users/search?q=${searchQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, getToken]);

  const handleDeletePost = async (postId: string) => {
    try {
      const token = await getToken();
      await axios.delete(`http://127.0.0.1:3000/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  // --- Socket Effects ---
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    const newSocket = io(apiUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });

    const setupSocket = async () => {
      const token = await getToken();
      if (token) {
        newSocket.auth = { token };
        newSocket.on("connect", () => {
          newSocket.emit("authenticate");
        });
        newSocket.connect();
      }
    };
    setupSocket();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const url =
          activeFilter === "ALL"
            ? "http://127.0.0.1:3000/posts"
            : `http://127.0.0.1:3000/posts?type=${activeFilter}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [activeFilter, getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!socket) return;

    const onLikeUpdate = ({
      postId,
      likeCount,
    }: {
      postId: string;
      likeCount: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: likeCount } }
            : p,
        ),
      );
    };

    const onCommentAdded = ({
      postId,
      comment,
      commentCount,
    }: {
      postId: string;
      comment: Comment;
      commentCount: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, comments: commentCount } }
            : p,
        ),
      );
      setActivePostForComments((prevActivePost) => {
        if (prevActivePost === postId) {
          setComments((prevComments) => {
            if (prevComments.some(c => c.id === comment.id)) return prevComments;
            return [...prevComments, comment];
          });
        }
        return prevActivePost;
      });
    };

    socket.on("post_like_update", onLikeUpdate);
    socket.on("post_comment_added", onCommentAdded);

    return () => {
      socket.off("post_like_update", onLikeUpdate);
      socket.off("post_comment_added", onCommentAdded);
    };
  }, [socket]);

  // --- Handlers ---

  const handleToggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isCurrentlyLiked = p.likes && p.likes.length > 0;
          return {
            ...p,
            likes: isCurrentlyLiked ? [] : [{ userId: "me" }],
            _count: {
              ...p._count,
              likes: isCurrentlyLiked
                ? Math.max(0, p._count.likes - 1)
                : p._count.likes + 1,
            },
          };
        }
        return p;
      }),
    );

    try {
      const token = await getToken();
      await axios.post(
        `http://127.0.0.1:3000/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleOpenComments = async (postId: string) => {
    setActivePostForComments(postId);
    setIsCommentsLoading(true);
    setComments([]);
    try {
      const token = await getToken();
      const res = await axios.get(
        `http://127.0.0.1:3000/posts/${postId}/comments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!activePostForComments || !newCommentContent.trim()) return;
    setIsSubmittingComment(true);
    try {
      const token = await getToken();
      await axios.post(
        `http://127.0.0.1:3000/posts/${activePostForComments}/comment`,
        { content: newCommentContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNewCommentContent("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  // Post Creation State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<PostType>("DISCUSSION");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedImages.length + filesArray.length > 4) {
        alert("You can only upload up to 4 images per post.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...filesArray].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return;
    setIsSubmitting(true);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("content", newPostContent);
      formData.append("postType", newPostType);
      formData.append("isAnonymous", isAnonymous ? "true" : "false");
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await axios.post("http://127.0.0.1:3000/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Add the new post to the top of the feed
      setPosts((prev) => {
        if (prev.some((p) => p.id === res.data.id)) return prev;
        return [res.data, ...prev];
      });
      // Reset form
      setNewPostContent("");
      setSelectedImages([]);
      setIsCreatingPost(false);
    } catch (error: any) {
      console.error(
        "Failed to create post:",
        error.response?.data || error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card font-sans pb-24">
      {/* Central Feed Container - Web Optimized Fixed Width */}
      <div className="max-w-2xl mx-auto relative pt-6 px-4">
        {/* Top Header - Floating Pill */}
        <div className="flex flex-col mb-8 gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-card/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-border">
              <button
                onClick={() => setActiveTab("COMMUNITY")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${activeTab === "COMMUNITY" ? "bg-[#3252DF] text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                Community @ UIC
              </button>
              <button
                onClick={() => setActiveTab("FOLLOWING")}
                className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${activeTab === "FOLLOWING" ? "bg-[#3252DF] text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              >
                Following
              </button>
            </div>
            <Button
              onClick={() => setIsCreatingPost(true)}
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full bg-zinc-900 hover:bg-foreground text-primary-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-zinc-800"
            >
              <Plus className="h-6 w-6" strokeWidth={3} />
            </Button>
          </div>

          {/* Search Users Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for students by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border-border rounded-full pl-10 h-10"
            />
            {searchQuery && (
              <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-lg z-30 overflow-hidden max-h-[300px] overflow-y-auto">
                {isSearchingUsers ? (
                  <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.clerkUserId}`}
                      className="flex items-center gap-3 p-3 hover:bg-secondary transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {(user.name || user.username || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {user.name || user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.major || "Student"} •{" "}
                          {user._count?.followers || 0} followers
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === "COMMUNITY" && (
            <div className="flex bg-card/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-border w-full sm:w-max overflow-x-auto scrollbar-hide">
              {(
                [
                  "ALL",
                  "DISCUSSION",
                  "EVENT",
                  "CHECK_IN",
                  "LOOKING_FOR",
                ] as const
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                    activeFilter === type
                      ? "bg-[#3252DF] text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "ALL" ? "All" : type.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <div className="bg-card rounded-[24px] border border-border shadow-sm p-12 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <h3 className="text-lg font-bold text-foreground mb-1">
                  No posts yet
                </h3>
                <p className="text-sm">Be the first to start a discussion!</p>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-[24px] border border-border shadow-sm p-5 sm:p-6 hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Avatar */}
                    {post.author.clerkUserId ? (
                      <Link href={`/profile/${post.author.clerkUserId}`}>
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 border border-border hover:opacity-80 transition-opacity">
                          <AvatarImage
                            src={post.author.avatarUrl || undefined}
                          />
                          <AvatarFallback className="bg-secondary text-muted-foreground font-bold">
                            {(post.author.name ||
                              post.author.username ||
                              "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 border border-border">
                        <AvatarImage src={post.author.avatarUrl || undefined} />
                        <AvatarFallback className="bg-secondary text-muted-foreground font-bold">
                          {(post.author.name ||
                            post.author.username ||
                            "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header: Name & Date */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.author.clerkUserId ? (
                            <Link
                              href={`/profile/${post.author.clerkUserId}`}
                              className="font-bold text-[15px] text-foreground hover:underline"
                            >
                              {post.author.name ||
                                post.author.username ||
                                "Anonymous Student"}
                            </Link>
                          ) : (
                            <span className="font-bold text-[15px] text-foreground">
                              {post.author.name ||
                                post.author.username ||
                                "Anonymous Student"}
                            </span>
                          )}
                          <span className="bg-secondary text-muted-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                            {post.postType.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-muted-foreground text-[13px] font-medium">
                            {formatDate(post.createdAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {post.author.clerkUserId ===
                                currentAuthUserId && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(post.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Copy Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {/* Text Body */}
                      <p className="text-[15px] text-foreground leading-snug whitespace-pre-wrap mb-3">
                        {post.content}
                      </p>
                      {/* Optional Image Grid */}
                      {post.imageUrls && post.imageUrls.length > 0 && (
                        <div
                          className={`mb-3 grid gap-2 ${post.imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                        >
                          {post.imageUrls.map((url, index) => (
                            <div
                              key={index}
                              className="rounded-2xl overflow-hidden border border-border bg-secondary max-h-[400px]"
                            >
                              <img
                                src={
                                  url.startsWith("http")
                                    ? url
                                    : `http://127.0.0.1:3000${url}`
                                }
                                alt={`Post attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Footer Actions */}
                      <div className="flex items-center gap-6 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(post.id);
                          }}
                          className={`flex items-center gap-2 transition-colors group ${post.likes && post.likes.length > 0 ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                        >
                          <Heart
                            className={`h-4 w-4 ${post.likes && post.likes.length > 0 ? "fill-rose-500" : "group-hover:fill-rose-100"}`}
                          />
                          <span className="text-[13px] font-medium">
                            {post._count?.likes || 0}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenComments(post.id);
                          }}
                          className="flex items-center gap-2 text-muted-foreground hover:text-[#3252DF] transition-colors group"
                        >
                          <MessageCircle className="h-4 w-4 group-hover:fill-blue-100" />
                          <span className="text-[13px] font-medium">
                            {post._count?.comments || 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Create Post Modal Overlay */}
        <AnimatePresence>
          {isCreatingPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
              onClick={() => setIsCreatingPost(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-card w-full max-w-xl rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-black text-foreground">
                    Create Post
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreatingPost(false)}
                    className="rounded-full text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">
                  {/* Post Type Selector */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {(
                      [
                        "DISCUSSION",
                        "EVENT",
                        "CHECK_IN",
                        "LOOKING_FOR",
                      ] as PostType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewPostType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          newPostType === type
                            ? "bg-[#3252DF] text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {type.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="What's on your mind?"
                    className="min-h-[120px] text-lg border-none focus-visible:ring-0 px-0 resize-none placeholder:text-muted-foreground"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    autoFocus
                  />

                  {/* Selected Images Preview Grid */}
                  {selectedImages.length > 0 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedImages.map((file, index) => (
                        <div
                          key={index}
                          className="relative shrink-0 h-24 w-24 rounded-2xl overflow-hidden border border-border"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-foreground/60 text-primary-foreground p-1 rounded-full hover:bg-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-[#3252DF] hover:bg-blue-50 rounded-full"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-border text-[#3252DF] focus:ring-[#3252DF]"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <span className="text-sm font-bold text-muted-foreground">
                          Anonymous
                        </span>
                      </label>
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={
                        (newPostContent.trim() === "" &&
                          selectedImages.length === 0) ||
                        isSubmitting
                      }
                      className="bg-[#3252DF] hover:bg-[#2841b3] text-primary-foreground font-bold rounded-full px-6"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Drawer/Modal */}
        <AnimatePresence>
          {activePostForComments && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4"
              onClick={() => setActivePostForComments(null)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-card w-full max-w-xl rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-[#3252DF]" />
                    Comments
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActivePostForComments(null)}
                    className="rounded-full text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isCommentsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#3252DF]" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      <p className="text-sm">No comments yet. Be the first!</p>
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={c.author.avatarUrl || undefined} />
                          <AvatarFallback className="bg-secondary text-[10px] font-bold">
                            {(c.author.name ||
                              c.author.username ||
                              "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-[13px] text-foreground">
                              {c.author.name ||
                                c.author.username ||
                                "Anonymous"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border bg-card shrink-0 sm:rounded-b-3xl">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      className="min-h-[44px] max-h-[120px] py-3 text-sm rounded-2xl resize-none focus-visible:ring-1 focus-visible:ring-[#3252DF]"
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit();
                        }
                      }}
                    />
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={
                        !newCommentContent.trim() || isSubmittingComment
                      }
                      className="rounded-full bg-[#3252DF] hover:bg-[#2841b3] text-primary-foreground shrink-0 h-11 px-6 font-bold"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Removed Floating Action Button */}
      </div>
    </div>
  );
}
