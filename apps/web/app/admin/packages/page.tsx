"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Boxes, CheckCircle2, Pencil, Plus, Search, XCircle } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  KeyValueRow,
  MobileRecord,
  MobileRecordList,
  PageHeader,
  Select
} from "@/components/ui";
import { apiFetch, type CreditPackage, type CreditPackageListResponse, type CreditPackageRequest } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const emptyForm: CreditPackageRequest = {
  name: "",
  credits: 100,
  price: 50000,
  isActive: true
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreditPackageRequest>(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadData() {
    const data = await apiFetch<CreditPackageListResponse>("/api/admin/packages");
    setPackages(data.items);
  }

  useEffect(() => {
    loadData().catch((error: Error) => showError(error, "Không tải được danh sách gói credit."));
  }, []);

  const filteredPackages = useMemo(
    () =>
      packages.filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && item.isActive) ||
          (statusFilter === "inactive" && !item.isActive);
        return matchesQuery && matchesStatus;
      }),
    [packages, query, statusFilter]
  );

  function editPackage(item: CreditPackage) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      credits: item.credits,
      price: item.price,
      isActive: item.isActive
    });
    setIsFormOpen(true);
  }

  function openCreateDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function closeFormDialog() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setIsSaving(false);
  }

  async function savePackage(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên gói credit là bắt buộc.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await apiFetch<CreditPackage>(`/api/admin/packages/${editingId}`, {
          method: "PUT",
          json: form
        });
        toast.success("Đã cập nhật gói credit.");
      } else {
        await apiFetch<CreditPackage>("/api/admin/packages", {
          method: "POST",
          json: form
        });
        toast.success("Đã tạo gói credit.");
      }

      closeFormDialog();
      await loadData();
    } catch (error) {
      showError(error, "Không lưu được gói credit.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Gói credit"
        title="Quản lý gói credit"
        description="Tạo, sửa và bật tắt gói credit dùng cho nạp credit và PayOS."
        actions={
        <Button type="button" onClick={openCreateDialog}>
          <Plus size={16} />
          <span className="ml-2">Tạo gói mới</span>
        </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Boxes} label="Tổng gói" value={String(packages.length)} />
        <Stat icon={CheckCircle2} label="Đang bật" tone="success" value={String(packages.filter((item) => item.isActive).length)} />
        <Stat icon={XCircle} label="Đang tắt" tone="warning" value={String(packages.filter((item) => !item.isActive).length)} />
        <Stat icon={Boxes} label="Gói PayOS hợp lệ" value={String(packages.filter((item) => item.isActive && item.price > 0 && item.price === Math.trunc(item.price)).length)} />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Danh sách gói credit</CardTitle>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={15} />
                <Input className="pl-9" placeholder="Tìm tên gói..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đang tắt</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPackages.length === 0 ? (
              <EmptyState title="Chưa có gói phù hợp" detail="Tạo gói credit đầu tiên hoặc đổi bộ lọc hiện tại." />
            ) : (
              <>
              <MobileRecordList>
                {filteredPackages.map((item) => (
                  <MobileRecord key={item.id}>
                    <KeyValueRow label="Tên gói" value={item.name} />
                    <KeyValueRow label="Credit" value={`${item.credits} cr`} />
                    <KeyValueRow label="Giá" value={formatCurrency(item.price)} />
                    <KeyValueRow
                      label="Trạng thái"
                      value={
                        <span className={item.isActive ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"}>
                          {item.isActive ? "Đang bật" : "Đang tắt"}
                        </span>
                      }
                    />
                    <KeyValueRow label="Ngày tạo" value={formatDate(item.createdAt)} />
                    <div className="border-t border-border/70 pt-3">
                      <Button className="w-full" type="button" variant="secondary" onClick={() => editPackage(item)}>
                        <Pencil size={14} />
                        <span className="ml-2">Sửa</span>
                      </Button>
                    </div>
                  </MobileRecord>
                ))}
              </MobileRecordList>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Tên gói</th>
                      <th className="px-3 py-2">Credit</th>
                      <th className="px-3 py-2">Giá</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Ngày tạo</th>
                      <th className="px-3 py-2">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.map((item) => (
                      <tr className="border-t border-border/70" key={item.id}>
                        <td className="px-3 py-3 font-medium">{item.name}</td>
                        <td className="px-3 py-3">{item.credits} cr</td>
                        <td className="px-3 py-3">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-3">
                          <span className={item.isActive ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"}>
                            {item.isActive ? "Đang bật" : "Đang tắt"}
                          </span>
                        </td>
                        <td className="px-3 py-3">{formatDate(item.createdAt)}</td>
                        <td className="px-3 py-3">
                          <Button className="min-h-8 px-3" type="button" variant="secondary" onClick={() => editPackage(item)}>
                            <Pencil size={14} />
                            <span className="ml-2">Sửa</span>
                          </Button>
                        </td>
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

      <Dialog open={isFormOpen} className="lg:pl-64" onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa gói credit" : "Tạo gói credit"}</DialogTitle>
            <DialogDescription>Thông tin gói sẽ được dùng cho nạp credit và PayOS.</DialogDescription>
          </DialogHeader>
          <form onSubmit={savePackage}>
            <DialogBody className="space-y-4">
              <label className="block text-sm font-medium">
                Tên gói
                <Input className="mt-2" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="block text-sm font-medium">
                Số credit
                <Input className="mt-2" min={1} type="number" value={form.credits} onChange={(event) => setForm((current) => ({ ...current, credits: Number(event.target.value) }))} />
              </label>
              <label className="block text-sm font-medium">
                Giá VND
                <Input className="mt-2" min={1} step={1} type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
              </label>
              <label className="flex items-center justify-between rounded-md border border-border/70 bg-white/55 p-3 text-sm font-medium">
                <span>Bật gói cho người dùng</span>
                <input checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" />
              </label>
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                Giá sử dụng cho PayOS phải là số nguyên VNĐ và lớn hơn 0. Đơn hàng nạp tiền đã được tạo sẽ giữ tín dụng chụp nhanh và số tiền cũ.
              </Alert>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeFormDialog}>Hủy</Button>
              <Button disabled={isSaving} type="submit">{isSaving ? "Đang lưu..." : "Lưu gói"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700"
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <div className="mt-3 h-1 w-10 rounded-full bg-primary/35" />
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span className={`rounded-md p-2 ${toneClass}`}>
          <Icon size={18} />
        </span>
      </CardContent>
    </Card>
  );
}
