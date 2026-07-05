"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { WarningModal } from "../../../components/admin/WarningModal";

export default function AdminUsers() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, [getToken]);

  async function fetchUsers() {
    const token = await getToken();
    if (!token) return;

    const res = await fetch("http://localhost:3000/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }

  async function toggleBan(id: string, currentStatus: boolean) {
    const token = await getToken();
    if (!token) return;

    await fetch(`http://localhost:3000/admin/users/${id}/ban`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isBanned: !currentStatus }),
    });

    fetchUsers(); // Refresh
  }

  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningUserId, setWarningUserId] = useState<string | null>(null);

  function openWarningModal(userId: string) {
    setWarningUserId(userId);
    setIsWarningModalOpen(true);
  }

  async function handleSendWarning(title: string, message: string) {
    if (!warningUserId) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`http://localhost:3000/admin/users/${warningUserId}/warn`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, message }),
    });

    if (res.ok) {
      toast.success("Warning sent successfully!");
    } else {
      toast.error("Failed to send warning.");
    }
    setIsWarningModalOpen(false);
    setWarningUserId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage users on Orbit.</p>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">University</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-4 font-medium">{user.email}</td>
                <td className="p-4">{user.university || "N/A"}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  {user.isBanned ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Banned</span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  {user.role !== "ADMIN" && (
                    <>
                      <button
                        onClick={() => toggleBan(user.id, user.isBanned)}
                        className={`text-sm px-3 py-1 rounded ${user.isBanned ? "bg-primary text-primary-foreground" : "bg-red-500 text-white"}`}
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => openWarningModal(user.id)}
                        className="text-sm border border-orange-500 text-orange-500 px-3 py-1 rounded hover:bg-orange-50"
                      >
                        Warn
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onSubmit={handleSendWarning}
      />
    </div>
  );
}
