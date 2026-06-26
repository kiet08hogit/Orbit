"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

type NotificationType =
  | "FOLLOW"
  | "LIKE"
  | "COMMENT"
  | "PURCHASE"
  | "OFFER"
  | "ALL";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
  actor: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

export function NotificationsMenu() {
  const { getToken, userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationType>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async (currentFilter: NotificationType) => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await axios.get(`http://127.0.0.1:3000/notifications`, {
        params: { filter: currentFilter },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `http://127.0.0.1:3000/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications(filter);
      fetchUnreadCount();

      let socket: Socket | null = null;

      const initSocket = async () => {
        const token = await getToken();
        socket = io("http://127.0.0.1:3000", {
          auth: { token },
          query: { userId },
        });

        socket.on("connect", () => {
          socket!.emit("authenticate", { token });
        });

        socket.on("new_notification", (newNotif: Notification) => {
          setUnreadCount((prev) => prev + 1);
          if (filter === "ALL" || filter === newNotif.type) {
            setNotifications((prev) => [newNotif, ...prev]);
          }
          toast(newNotif.title, {
            description: newNotif.content || "",
          });
        });
      };
      
      initSocket();

      return () => {
        socket?.disconnect();
      };
    }
  }, [userId, filter, getToken]);

  const markAsRead = async (id: string, linkUrl: string | null) => {
    try {
      const token = await getToken();
      await axios.patch(
        `http://127.0.0.1:3000/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (linkUrl) {
        window.location.href = linkUrl;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      await axios.patch(
        `http://127.0.0.1:3000/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex items-center justify-center h-[32px] w-[32px] rounded-full hover:bg-secondary focus:outline-none">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] rounded-xl p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="h-auto p-0 text-[11px] text-[#3252DF] hover:bg-transparent font-semibold"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1 p-2 overflow-x-auto border-b border-border scrollbar-hide">
          {["ALL", "FOLLOW", "LIKE", "COMMENT", "PURCHASE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as NotificationType)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.linkUrl)}
                  className={`p-3 flex gap-3 cursor-pointer hover:bg-secondary/50 transition-colors border-b border-border last:border-0 ${!notif.isRead ? "bg-[#3252DF]/5" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notif.actor?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {(notif.actor?.name ||
                        notif.actor?.username ||
                        "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-[12px] font-medium leading-tight">
                      <span className="font-bold">
                        {notif.actor?.name ||
                          notif.actor?.username ||
                          "Someone"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {notif.title === "New Follower"
                          ? "started following you"
                          : notif.title === "New Like"
                            ? "liked your post"
                            : notif.title === "New Comment"
                              ? "commented on your post"
                              : notif.title === "New Reservation"
                                ? "purchased an item"
                                : ""}
                      </span>
                    </p>
                    {notif.content && notif.type === "COMMENT" && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {notif.content
                          .split('commented: "')[1]
                          ?.replace('"', "") || notif.content}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-[#3252DF] shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
