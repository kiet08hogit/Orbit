"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function CustomUserButton() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none border-none ring-0 focus:ring-0 focus:outline-none">
        <Avatar className="h-8 w-8 transition-opacity hover:opacity-80">
          <AvatarImage src={user.imageUrl} />
          <AvatarFallback className="bg-[#3252DF] text-white">
            {user.firstName?.charAt(0) || ""}
            {user.lastName?.charAt(0) || ""}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-zinc-200 dark:border-zinc-800">
        <div className="py-3 px-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-zinc-900 dark:text-zinc-50">
              {user.fullName}
            </p>
            <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem 
          className="cursor-pointer py-2.5 px-3 focus:bg-zinc-100 dark:focus:bg-zinc-800"
          onClick={() => router.push(`/profile/${user.id}`)}
        >
          <User className="mr-2 h-4 w-4" />
          <span className="font-medium">My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem
          className="cursor-pointer py-2.5 px-3 text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-300"
          onClick={() => signOut(() => router.push("/"))}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
