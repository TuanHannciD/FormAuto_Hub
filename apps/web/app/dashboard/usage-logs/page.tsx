"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, KeyValueRow, MobileRecord, MobileRecordList, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type UsageLog } from "@/lib/api";
import { displayAction, displayToolName } from "@/lib/labels";
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
      <PageHeader title="Lịch sử sử dụng" description="Theo dõi thao tác hệ thống, credit đã dùng và kết quả xử lý." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Tổng thao tác" value={String(logs.length)} />
        <Metric label="Credit đã dùng" value={String(creditsUsed)} />
        <Metric label="Thao tác thất bại" value={String(logs.filter((log) => log.status === "Failed").length)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bảng lịch sử sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState title="Chưa có lịch sử sử dụng" detail="Các lần phân tích, tạo bản xem trước và gửi câu trả lời sẽ được ghi tại đây." />
          ) : (
            <>
            <MobileRecordList>
              {logs.map((log) => (
                <MobileRecord key={log.id}>
                  <KeyValueRow label="Thời gian" value={formatDate(log.createdAt)} />
                  <KeyValueRow label="Công cụ" value={displayToolName(log.toolName)} />
                  <KeyValueRow label="Thao tác" value={displayAction(log.action)} />
                  <KeyValueRow label="Credit" value={log.creditsUsed} />
                  <KeyValueRow label="Kết quả" value={<StatusBadge status={log.status} />} />
                  <KeyValueRow label="Mô tả" value={log.description} />
                </MobileRecord>
              ))}
            </MobileRecordList>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Công cụ</th>
                    <th className="py-2">Thao tác</th>
                    <th className="py-2">Credit</th>
                    <th className="py-2">Kết quả</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr className="border-t border-border" key={log.id}>
                      <td className="py-3">{formatDate(log.createdAt)}</td>
                      <td className="py-3">{displayToolName(log.toolName)}</td>
                      <td className="py-3">{displayAction(log.action)}</td>
                      <td className="py-3">{log.creditsUsed}</td>
                      <td className="py-3"><StatusBadge status={log.status} /></td>
                      <td className="py-3">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
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
