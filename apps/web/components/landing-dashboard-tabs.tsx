"use client";

import { useState } from "react";
import { Activity, Clock3, CreditCard, FileText, Gauge, History, Wallet } from "lucide-react";

const tabs = [
  { id: "overview", label: "Tổng quan", icon: Gauge },
  { id: "topups", label: "Đơn nạp", icon: CreditCard },
  { id: "usage", label: "Sử dụng", icon: Activity },
  { id: "credit", label: "Credit", icon: Wallet }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function LandingDashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="motion-card mx-auto w-full max-w-5xl rounded-lg border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/70 to-emerald-50/60 p-2 shadow-xl shadow-cyan-900/10">
      <div className="overflow-hidden rounded border border-white/80 bg-white/86 backdrop-blur">
        <div className="flex gap-3 overflow-x-auto border-b border-cyan-100/70 bg-white/70 px-4 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "inline-flex whitespace-nowrap border-b-2 border-cyan-600 pb-3 text-xs font-bold text-cyan-700 transition-colors"
                  : "inline-flex whitespace-nowrap border-b-2 border-transparent pb-3 text-xs font-medium text-slate-500 transition-colors hover:border-cyan-200 hover:text-cyan-700"
              }
            >
              <tab.icon className="mr-1.5" size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-h-[420px] bg-gradient-to-br from-slate-50/70 via-white to-cyan-50/60 p-3 sm:p-5 md:p-6">
          {activeTab === "overview" && <OverviewPanel />}
          {activeTab === "topups" && (
            <TablePanel
              title="Yêu cầu nạp gần đây"
              columns={["Credit", "Số tiền", "Trạng thái", "Tạo lúc"]}
              emptyTitle="Chưa có yêu cầu nạp gần đây"
              emptyDetail="Nạp thêm credit khi cần tiếp tục sử dụng."
            />
          )}
          {activeTab === "usage" && (
            <TablePanel
              title="Lịch sử sử dụng gần đây"
              columns={["Thời gian", "Thao tác", "Credit", "Kết quả", "Mô tả"]}
              emptyTitle="Chưa có lịch sử sử dụng gần đây"
              emptyDetail="Các lần phân tích, tạo bản xem trước và gửi câu trả lời sẽ xuất hiện tại đây."
            />
          )}
          {activeTab === "credit" && (
            <TablePanel
              title="Giao dịch credit"
              columns={["Thời gian", "Loại", "Credit", "Số dư sau", "Mô tả"]}
              emptyTitle="Chưa có giao dịch credit"
              emptyDetail="Giao dịch khởi tạo, nạp credit và sử dụng credit sẽ xuất hiện tại đây."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Tổng quan vận hành</h3>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi credit, yêu cầu nạp và các thao tác biểu mẫu gần đây.
        </p>
      </div>
      <div className="rounded border border-cyan-100 bg-gradient-to-r from-cyan-50 to-emerald-50 px-4 py-3 text-sm text-cyan-900 shadow-sm">
        Tự động hóa biểu mẫu luôn phải xem trước, người dùng phải xác nhận rõ ràng, và mỗi lần chỉ tạo 1 đến 100 câu trả lời xem trước.
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Credit hiện có" value="-" icon={Wallet} tone="cyan" />
        <Metric title="Đã nạp" value="-" icon={CreditCard} tone="emerald" />
        <Metric title="Đã dùng" value="-" icon={History} tone="amber" />
        <Metric title="Yêu cầu chờ duyệt" value="-" icon={Clock3} tone="fuchsia" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="motion-card rounded-lg border border-cyan-100 bg-white shadow-sm">
          <div className="border-b border-cyan-100/70 bg-cyan-50/50 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-900">Việc nên làm tiếp</h4>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="motion-button rounded-md border border-cyan-100 bg-cyan-50/60 p-3 text-cyan-950">Phân tích link Google Form và cài đặt cách trả lời</div>
            <div className="motion-button rounded-md border border-emerald-100 bg-emerald-50/60 p-3 text-emerald-950">Nạp credit hoặc theo dõi giao dịch PayOS</div>
            <div className="motion-button rounded-md border border-amber-100 bg-amber-50/60 p-3 text-amber-950">Kiểm tra lịch sử sử dụng và hành động bị chặn</div>
          </div>
        </div>
        <div className="motion-card rounded-lg border border-emerald-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-emerald-100/70 bg-emerald-50/50 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-900">Yêu cầu nạp gần đây</h4>
          </div>
          <EmptyBlock title="Chưa có yêu cầu nạp gần đây" detail="Nạp thêm credit khi cần tiếp tục sử dụng." />
        </div>
      </div>
      <div className="motion-card rounded-lg border border-indigo-100 bg-white shadow-sm">
        <div className="border-b border-indigo-100/70 bg-indigo-50/50 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-900">Lịch sử sử dụng gần đây</h4>
        </div>
        <EmptyBlock
          title="Chưa có lịch sử sử dụng gần đây"
          detail="Các lần phân tích, tạo bản xem trước và gửi câu trả lời sẽ xuất hiện tại đây."
        />
      </div>
    </div>
  );
}

function TablePanel({
  title,
  columns,
  emptyTitle,
  emptyDetail
}: {
  title: string;
  columns: string[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <div className="motion-card rounded-lg border border-cyan-100 bg-white shadow-sm">
      <div className="border-b border-cyan-100/70 bg-cyan-50/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-4 pt-3">
        <div className="grid gap-2 sm:hidden">
          {columns.slice(0, 4).map((column) => (
            <div className="motion-button rounded-md border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs font-medium text-cyan-800" key={column}>
              {column}
            </div>
          ))}
        </div>
      </div>
      <div className="hidden overflow-x-auto px-4 pt-3 sm:block">
        <div className="grid min-w-[620px] grid-flow-col auto-cols-fr text-sm text-slate-500">
          {columns.map((column) => (
            <span key={column} className="py-2 font-medium">
              {column}
            </span>
          ))}
        </div>
      </div>
      <EmptyBlock title={emptyTitle} detail={emptyDetail} />
    </div>
  );
}

const metricTones = {
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  fuchsia: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700"
};

function Metric({
  title,
  value,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  tone: keyof typeof metricTones;
}) {
  return (
    <div className="motion-card rounded-lg border border-white bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${metricTones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="m-4 rounded-lg border border-dashed border-cyan-200 bg-gradient-to-br from-white to-cyan-50/45 px-4 py-8 text-center transition-colors hover:border-cyan-300">
      <FileText className="mx-auto mb-3 text-cyan-500" size={22} />
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
