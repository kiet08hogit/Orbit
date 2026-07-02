"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function AdminOverview() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("http://localhost:3000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    }
    fetchStats();
  }, [getToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">High-level stats for your marketplace.</p>
      </div>

      {!stats ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.totalUsers} />
          <StatCard title="Total Listings" value={stats.totalListings} />
          <StatCard title="Pending Reports" value={stats.pendingReports} />
          <StatCard title="Transactions" value={stats.totalTransactions} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
