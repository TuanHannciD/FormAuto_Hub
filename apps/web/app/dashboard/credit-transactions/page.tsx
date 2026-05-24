"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, KeyValueRow, MobileRecord, MobileRecordList, PageHeader } from "@/components/ui";
import { Badge } from "@/components/ui";
import { apiFetch, type CreditTransaction } from "@/lib/api";
import { displayCreditTransactionType } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export default function CreditTransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    apiFetch<{ items: CreditTransaction[] }>("/api/credit-transactions")
      .then((data) => setTransactions(data.items))
      .catch(() => setTransactions([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Giao dịch credit" description="Lịch sử ghi nhận credit được nạp và credit đã sử dụng." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Tổng giao dịch" value={String(transactions.length)} />
        <Metric label="Credit mới nhất" value={transactions[0] ? String(transactions[0].amount) : "-"} />
        <Metric label="Số dư mới nhất" value={transactions[0] ? String(transactions[0].balanceAfter) : "-"} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sổ ghi credit</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState title="Chưa có giao dịch credit" detail="Yêu cầu nạp được duyệt và lần tạo bản xem trước thành công sẽ được ghi tại đây." />
          ) : (
            <>
            <MobileRecordList>
              {transactions.map((transaction) => (
                <MobileRecord key={transaction.id}>
                  <KeyValueRow label="Thời gian" value={formatDate(transaction.createdAt)} />
                  <KeyValueRow label="Loại" value={<Badge tone="info">{displayCreditTransactionType(transaction.type)}</Badge>} />
                  <KeyValueRow label="Số credit" value={transaction.amount} />
                  <KeyValueRow label="Số dư sau đó" value={transaction.balanceAfter} />
                  <KeyValueRow label="Mô tả" value={transaction.description} />
                </MobileRecord>
              ))}
            </MobileRecordList>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Loại</th>
                    <th className="py-2">Số credit</th>
                    <th className="py-2">Số dư sau đó</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr className="border-t border-border/70" key={transaction.id}>
                      <td className="py-3">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3"><Badge tone="info">{displayCreditTransactionType(transaction.type)}</Badge></td>
                      <td className="py-3">{transaction.amount}</td>
                      <td className="py-3">{transaction.balanceAfter}</td>
                      <td className="py-3">{transaction.description}</td>
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
        <div className="mb-4 h-1 w-10 rounded-full bg-primary/35" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
