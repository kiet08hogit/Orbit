"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { WarningModal } from "../../../components/admin/WarningModal";

export default function AdminReports() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, [getToken]);

  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningUserId, setWarningUserId] = useState<string | null>(null);

  async function fetchReports() {
    const token = await getToken();
    if (!token) return;

    const res = await fetch("http://localhost:3000/admin/reports", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setReports(data);
    }
  }

  async function updateStatus(id: string, status: string) {
    const token = await getToken();
    if (!token) return;

    await fetch(`http://localhost:3000/admin/reports/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    fetchReports(); // Refresh
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Manage user and listing reports.</p>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Reason</th>
              <th className="p-4 font-medium">Reporter</th>
              <th className="p-4 font-medium">Target</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-t">
                <td className="p-4">{report.reason}</td>
                <td className="p-4">{report.reporter?.email || "Unknown"}</td>
                <td className="p-4">
                  {report.reportedUser ? `User: ${report.reportedUser.email}` : report.listing ? `Listing: ${report.listing.title}` : "App Feedback / General"}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {report.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {report.status === "PENDING" && (
                    <>
                      <button onClick={() => updateStatus(report.id, "RESOLVED")} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Resolve</button>
                      <button onClick={() => updateStatus(report.id, "DISMISSED")} className="text-sm border px-3 py-1 rounded hover:bg-muted">Dismiss</button>
                    </>
                  )}
                  {report.reportedUser && (
                    <button onClick={() => openWarningModal(report.reportedUser.id)} className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600">Warn User</button>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">No reports found.</td>
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
