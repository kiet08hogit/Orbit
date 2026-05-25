"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  MoreHorizontal,
  Heart,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type PostType = "DISCUSSION" | "EVENT" | "CHECK_IN" | "LOOKING_FOR";

interface MockPost {
  id: string;
  content: string;
  type: PostType;
  author: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  imageUrl?: string;
}

const MOCK_POSTS: MockPost[] = [
  {
    id: "1",
    content: "Looking to buy the Skechers with the wheels in the back is anyone selling?",
    type: "LOOKING_FOR",
    author: {
      name: "Arthur Touzot",
      username: "arthurt",
      avatarUrl: "https://i.pravatar.cc/150?img=11"
    },
    createdAt: "21 May",
    likes: 4,
    comments: 0,
  },
  {
    id: "2",
    content: "With the CEO 👀👀👀👀",
    type: "CHECK_IN",
    author: {
      name: "Alyana Satchu",
      username: "alyanas",
      avatarUrl: "https://i.pravatar.cc/150?img=5"
    },
    createdAt: "30 Apr",
    likes: 12,
    comments: 3,
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "3",
    content: "Heard he ate the can too when he was done",
    type: "DISCUSSION",
    author: {
      name: "Maddy Cerello",
      username: "maddyc",
      avatarUrl: "https://i.pravatar.cc/150?img=47"
    },
    createdAt: "30 Apr",
    likes: 8,
    comments: 1,
    imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "4",
    content: "Does anyone have a spare iClicker they don't need anymore? Willing to pay $20. Can meet up anywhere on east campus today.",
    type: "LOOKING_FOR",
    author: {
      name: "David Kim",
      username: "dkim_dev",
      avatarUrl: "https://i.pravatar.cc/150?img=33"
    },
    createdAt: "1d ago",
    likes: 5,
    comments: 2,
  }
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"COMMUNITY" | "FOLLOWING">("COMMUNITY");
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50/30 font-sans">
      {/* Central Feed Container - Web Optimized Fixed Width */}
      <div className="max-w-2xl mx-auto bg-white min-h-screen border-x border-zinc-200 shadow-sm relative">
        
        {/* Top Navigation Tabs */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200">
          <div className="flex w-full">
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
        </div>

        {/* Feed Posts */}
        <div className="pb-24">
          <AnimatePresence mode="popLayout">
            {MOCK_POSTS.map((post) => (
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
                    <AvatarImage src={post.author.avatarUrl} />
                    <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    
                    {/* Header: Name & Date */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[15px] text-zinc-900">{post.author.name}</span>
                        {/* Optionally show username on larger screens, or hide to match reference perfectly */}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-zinc-500 text-[13px] font-medium">{post.createdAt}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-900 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Text Body */}
                    <p className="text-[15px] text-zinc-900 leading-snug whitespace-pre-wrap mb-3">
                      {post.content}
                    </p>
                    
                    {/* Optional Image */}
                    {post.imageUrl && (
                      <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 max-h-[400px]">
                        <img 
                          src={post.imageUrl} 
                          alt="Post attachment" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Footer Actions */}
                    <div className="flex items-center gap-6 mt-1">
                      <button className="flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors group">
                        <Heart className="h-4 w-4 group-hover:fill-rose-100" />
                        <span className="text-[13px] font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-zinc-500 hover:text-[#3252DF] transition-colors group">
                        <MessageCircle className="h-4 w-4 group-hover:fill-blue-100" />
                        <span className="text-[13px] font-medium">{post.comments}</span>
                      </button>
                    </div>
                    
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Action Button (FAB) */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 sm:absolute sm:bottom-6 sm:-right-20 lg:-right-24"
        >
          <Button 
            onClick={() => setIsCreatingPost(true)}
            className="h-14 w-14 rounded-full bg-[#0088FF] hover:bg-[#0077EE] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
          </Button>
        </motion.div>
        
      </div>
    </div>
  );
}
