import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { Badge } from "@/components/ui";
import { apiFetch, type CreditTransaction } from "@/lib/api";
import { formatDate } from "@/lib/utils";

async function getTransactions() {
  try {
    return (await apiFetch<{ items: CreditTransaction[] }>("/api/credit-transactions")).items;
  } catch {
    return [];
  }
}

export default async function CreditTransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Giao dịch credit</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ledger bất biến cho credit nạp và credit sử dụng.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Credit ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState title="Chưa có giao dịch credit" detail="Top-up được duyệt và preview generation thành công sẽ ghi ledger tại đây." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Loại</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Balance after</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr className="border-t border-border" key={transaction.id}>
                      <td className="py-3">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3"><Badge tone="info">{transaction.type}</Badge></td>
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
