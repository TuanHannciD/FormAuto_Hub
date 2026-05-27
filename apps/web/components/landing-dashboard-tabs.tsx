"use client";

import { useState } from "react";

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "topups", label: "Đơn nạp" },
  { id: "usage", label: "Sử dụng" },
  { id: "credit", label: "Credit" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function LandingDashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="motion-card mx-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
      <div className="rounded border border-slate-100 bg-white">
        <div className="flex gap-4 overflow-x-auto border-b border-slate-100 px-4 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "whitespace-nowrap border-b-2 border-blue-600 pb-3 text-xs font-bold text-blue-600 transition-colors"
                  : "whitespace-nowrap border-b-2 border-transparent pb-3 text-xs font-medium text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-h-[420px] bg-slate-50/60 p-3 sm:p-5 md:p-6">
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
      <div className="rounded border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
        Tự động hóa biểu mẫu luôn phải xem trước, người dùng phải xác nhận rõ ràng, và mỗi lần chỉ tạo 1 đến 100 câu trả lời xem trước.
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Credit hiện có" value="-" />
        <Metric title="Đã nạp" value="-" />
        <Metric title="Đã dùng" value="-" />
        <Metric title="Yêu cầu chờ duyệt" value="-" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="motion-card rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-900">Việc nên làm tiếp</h4>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="motion-button rounded-md border border-slate-200 p-3">Phân tích link Google Form và cài đặt cách trả lời</div>
            <div className="motion-button rounded-md border border-slate-200 p-3">Nạp credit hoặc theo dõi giao dịch PayOS</div>
            <div className="motion-button rounded-md border border-slate-200 p-3">Kiểm tra lịch sử sử dụng và hành động bị chặn</div>
          </div>
        </div>
        <div className="motion-card rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-900">Yêu cầu nạp gần đây</h4>
          </div>
          <EmptyBlock title="Chưa có yêu cầu nạp gần đây" detail="Nạp thêm credit khi cần tiếp tục sử dụng." />
        </div>
      </div>
      <div className="motion-card rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
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
    <div className="motion-card rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-4 pt-3">
        <div className="grid gap-2 sm:hidden">
          {columns.slice(0, 4).map((column) => (
            <div className="motion-button rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600" key={column}>
              {column}
            </div>
          ))}
        </div>
      </div>
      <div className="hidden overflow-x-auto px-4 pt-3 sm:block">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
      <EmptyBlock title={emptyTitle} detail={emptyDetail} />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="motion-card rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="m-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center transition-colors hover:border-blue-200">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
