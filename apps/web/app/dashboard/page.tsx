"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Card, CardContent, CardHeader, CardTitle, EmptyState, KeyValueRow, MobileRecord, MobileRecordList, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type DashboardSummary } from "@/lib/api";
import { displayAction } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    apiFetch<DashboardSummary>("/api/dashboard/summary")
      .then(setSummary)
      .catch((error: Error) => showError(error, "Không tải được tổng quan vận hành."));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan vận hành" description="Theo dõi credit, yêu cầu nạp và các thao tác biểu mẫu gần đây." />

      <Alert>
        Tự động hóa biểu mẫu luôn phải xem trước, người dùng phải xác nhận rõ ràng, và mỗi lần chỉ tạo 1 đến 100 câu trả lời xem trước.
      </Alert>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Credit hiện có" value={summary ? String(summary.currentCreditBalance) : "-"} />
        <Metric title="Đã nạp" value={summary ? String(summary.totalCreditsDeposited) : "-"} />
        <Metric title="Đã dùng" value={summary ? String(summary.totalCreditsUsed) : "-"} />
        <Metric title="Yêu cầu chờ duyệt" value={summary ? String(summary.pendingTopupOrders) : "-"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Việc nên làm tiếp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/forms">
              Phân tích link Google Form và cài đặt cách trả lời
            </Link>
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/top-up">
              Nạp credit hoặc theo dõi giao dịch PayOS
            </Link>
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/usage-logs">
              Kiểm tra lịch sử sử dụng và hành động bị chặn
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Yêu cầu nạp gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary || summary.recentTopupOrders.length === 0 ? (
              <EmptyState title="Chưa có yêu cầu nạp gần đây" detail="Nạp thêm credit khi cần tiếp tục sử dụng." />
            ) : (
              <>
              <MobileRecordList>
                {summary.recentTopupOrders.map((order) => (
                  <MobileRecord key={order.id}>
                    <KeyValueRow label="Credit" value={order.credits} />
                    <KeyValueRow label="Số tiền" value={formatCurrency(order.amount)} />
                    <KeyValueRow label="Trạng thái" value={<StatusBadge status={order.status} />} />
                    <KeyValueRow label="Tạo lúc" value={formatDate(order.createdAt)} />
                  </MobileRecord>
                ))}
              </MobileRecordList>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Credit</th>
                      <th className="py-2">Số tiền</th>
                      <th className="py-2">Trạng thái</th>
                      <th className="py-2">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentTopupOrders.map((order) => (
                      <tr className="border-t border-border/70" key={order.id}>
                        <td className="py-3">{order.credits}</td>
                        <td className="py-3">{formatCurrency(order.amount)}</td>
                        <td className="py-3"><StatusBadge status={order.status} /></td>
                        <td className="py-3">{formatDate(order.createdAt)}</td>
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

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử sử dụng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
            {!summary || summary.recentUsageLogs.length === 0 ? (
              <EmptyState title="Chưa có lịch sử sử dụng gần đây" detail="Các lần phân tích, tạo bản xem trước và gửi câu trả lời sẽ xuất hiện tại đây." />
            ) : (
            <>
            <MobileRecordList>
              {summary.recentUsageLogs.map((log) => (
                <MobileRecord key={log.id}>
                  <KeyValueRow label="Thời gian" value={formatDate(log.createdAt)} />
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
                    <th className="py-2">Thao tác</th>
                    <th className="py-2">Credit</th>
                    <th className="py-2">Kết quả</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentUsageLogs.map((log) => (
                    <tr className="border-t border-border/70" key={log.id}>
                      <td className="py-3">{formatDate(log.createdAt)}</td>
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

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 h-1 w-10 rounded-full bg-primary/35" />
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
