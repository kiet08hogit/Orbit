"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { 
  MessageCircle, 
  MoreHorizontal,
  Heart,
  Plus,
  Image as ImageIcon,
  Loader2,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  };
  _count: {
    likes: number;
    comments: number;
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
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function CommunityClient({ initialPosts }: { initialPosts: Post[] }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"COMMUNITY" | "FOLLOWING">("COMMUNITY");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await axios.post("http://localhost:3000/posts", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      
      // Add the new post to the top of the feed
      setPosts([res.data, ...posts]);
      
      // Reset form
      setNewPostContent("");
      setSelectedImages([]);
      setIsCreatingPost(false);
    } catch (error: any) {
      console.error("Failed to create post:", error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50/30">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50/30 font-sans">
      {/* Central Feed Container - Web Optimized Fixed Width */}
      <div className="max-w-2xl mx-auto bg-white min-h-screen border-x border-zinc-200 shadow-sm relative">
        
        {/* Top Navigation Tabs */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center pr-3">
          <div className="flex flex-1">
            <button 
              onClick={() => setActiveTab("COMMUNITY")}
              className={`flex-1 py-4 text-sm font-bold text-center relative transition-colors ${activeTab === "COMMUNITY" ? "text-[#3252DF]" : "text-zinc-500 hover:bg-zinc-50"}`}
            >
              Community @ UIC
              {activeTab === "COMMUNITY" && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3252DF] rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab("FOLLOWING")}
              className={`flex-1 py-4 text-sm font-bold text-center relative transition-colors ${activeTab === "FOLLOWING" ? "text-[#3252DF]" : "text-zinc-500 hover:bg-zinc-50"}`}
            >
              Following
              {activeTab === "FOLLOWING" && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3252DF] rounded-t-full" />
              )}
            </button>
          </div>
          
          <div className="shrink-0 ml-2">
            <Button 
              onClick={() => setIsCreatingPost(true)}
              size="icon"
              className="h-10 w-10 rounded-full bg-[#0088FF] hover:bg-[#0077EE] text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
            </Button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="pb-24">
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <h3 className="text-lg font-bold text-zinc-900 mb-1">No posts yet</h3>
                <p className="text-sm">Be the first to start a discussion!</p>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 sm:p-5 border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 border border-zinc-100">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">
                        {(post.author.name || post.author.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      
                      {/* Header: Name & Date */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[15px] text-zinc-900">
                            {post.author.name || post.author.username || "Anonymous Student"}
                          </span>
                          <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                            {post.postType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-zinc-500 text-[13px] font-medium">{formatDate(post.createdAt)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-900 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Text Body */}
                      <p className="text-[15px] text-zinc-900 leading-snug whitespace-pre-wrap mb-3">
                        {post.content}
                      </p>
                      
                      {/* Optional Image Grid */}
                      {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className={`mb-3 grid gap-2 ${post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {post.imageUrls.map((url, index) => (
                            <div key={index} className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 max-h-[400px]">
                              <img 
                                src={url.startsWith('http') ? url : `http://localhost:3000${url}`} 
                                alt={`Post attachment ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer Actions */}
                      <div className="flex items-center gap-6 mt-1">
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors group">
                          <Heart className="h-4 w-4 group-hover:fill-rose-100" />
                          <span className="text-[13px] font-medium">{post._count?.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 text-zinc-500 hover:text-[#3252DF] transition-colors group">
                          <MessageCircle className="h-4 w-4 group-hover:fill-blue-100" />
                          <span className="text-[13px] font-medium">{post._count?.comments || 0}</span>
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
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
              onClick={() => setIsCreatingPost(false)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                  <h2 className="text-lg font-black text-black">Create Post</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsCreatingPost(false)} className="rounded-full text-zinc-500 hover:bg-zinc-100">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="p-4">
                  {/* Post Type Selector */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {(["DISCUSSION", "EVENT", "CHECK_IN", "LOOKING_FOR"] as PostType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewPostType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          newPostType === type 
                            ? "bg-[#3252DF] text-white" 
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <Textarea 
                    placeholder="What's on your mind?"
                    className="min-h-[120px] text-lg border-none focus-visible:ring-0 px-0 resize-none placeholder:text-zinc-400"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    autoFocus
                  />

                  {/* Selected Images Preview Grid */}
                  {selectedImages.length > 0 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative shrink-0 h-24 w-24 rounded-xl overflow-hidden border border-zinc-200">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
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
                      className="text-zinc-400 hover:text-[#3252DF] hover:bg-blue-50 rounded-full"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    
                    <Button 
                      onClick={handleCreatePost}
                      disabled={(newPostContent.trim() === "" && selectedImages.length === 0) || isSubmitting}
                      className="bg-[#3252DF] hover:bg-[#2841b3] text-white font-bold rounded-full px-6"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
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
