"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type UsageLog } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function UsageLogsPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);

  useEffect(() => {
    apiFetch<{ items: UsageLog[] }>("/api/usage-logs")
      .then((data) => setLogs(data.items))
      .catch(() => setLogs([]));
  }, []);

  const creditsUsed = logs.reduce((total, log) => total + log.creditsUsed, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Lịch sử sử dụng</h2>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi tool actions, credits used và kết quả workflow.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Tổng actions" value={String(logs.length)} />
        <Metric label="Credits used" value={String(creditsUsed)} />
        <Metric label="Failed actions" value={String(logs.filter((log) => log.status === "Failed").length)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usage log table</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState title="Chưa có usage logs" detail="Analyze, preview generation và submission actions sẽ được ghi tại đây." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Tool</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Credits</th>
                    <th className="py-2">Kết quả</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr className="border-t border-border" key={log.id}>
                      <td className="py-3">{formatDate(log.createdAt)}</td>
                      <td className="py-3">{log.toolName}</td>
                      <td className="py-3">{log.action}</td>
                      <td className="py-3">{log.creditsUsed}</td>
                      <td className="py-3"><StatusBadge status={log.status} /></td>
                      <td className="py-3">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
