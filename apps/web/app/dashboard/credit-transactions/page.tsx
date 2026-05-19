"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
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
      <div>
        <h2 className="text-2xl font-semibold">Giao dịch credit</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lịch sử ghi nhận credit được nạp và credit đã sử dụng.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sổ ghi credit</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState title="Chưa có giao dịch credit" detail="Yêu cầu nạp được duyệt và lần tạo bản xem trước thành công sẽ được ghi tại đây." />
          ) : (
            <div className="overflow-x-auto">
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
                    <tr className="border-t border-border" key={transaction.id}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
