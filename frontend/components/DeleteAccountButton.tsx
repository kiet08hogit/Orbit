"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function DeleteAccountButton() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await user.delete();
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="w-full rounded-full h-12 font-bold bg-[#272343] hover:bg-black text-white shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete & Try Again"}
    </Button>
  );
}
