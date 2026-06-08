"use client";

import { useState } from "react";
import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface RedemptionRow {
  id: string;
  status: string;
  starsSpent: number;
  createdAt: string;
  note: string | null;
  child: { id: string; name: string };
  resource: { resourceType: string; resourceKey: string; title: string } | null;
}

const STATUS: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "已完成", color: "blue" },
  PENDING_FULFILLMENT: { label: "待发放", color: "gold" },
  FULFILLED: { label: "已发放", color: "green" },
  REJECTED_REFUNDED: { label: "已退回", color: "red" },
};

export function RedemptionTable({ rows, baseUrl }: { rows: RedemptionRow[]; baseUrl: string }) {
  const [data, setData] = useState<RedemptionRow[]>(rows);
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (row: RedemptionRow, action: "fulfill" | "reject") => {
    setBusyId(row.id);
    try {
      const res = await fetch(`${baseUrl}/${row.id}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error("action_failed");
      const status = action === "fulfill" ? "FULFILLED" : "REJECTED_REFUNDED";
      setData((current) => current.map((r) => (r.id === row.id ? { ...r, status } : r)));
      message.success(action === "fulfill" ? "已发放" : "已退回星星");
    } catch {
      message.error("操作失败，请重试");
    } finally {
      setBusyId(null);
    }
  };

  const columns: ColumnsType<RedemptionRow> = [
    { title: "孩子", dataIndex: ["child", "name"], key: "child", width: 110 },
    {
      title: "奖励",
      key: "resource",
      render: (_: unknown, row) => row.resource?.title ?? row.resource?.resourceKey ?? "—",
    },
    { title: "花费", dataIndex: "starsSpent", key: "starsSpent", width: 90, render: (v: number) => `⭐ ${v}` },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const meta = STATUS[status] ?? { label: status, color: "default" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (value: string) => new Date(value).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 180,
      render: (_: unknown, row) =>
        row.status === "PENDING_FULFILLMENT" ? (
          <Space>
            <Button size="small" type="primary" loading={busyId === row.id} onClick={() => act(row, "fulfill")}>
              发放
            </Button>
            <Popconfirm title="退回并返还星星？" onConfirm={() => act(row, "reject")}>
              <Button size="small" danger loading={busyId === row.id}>
                退回
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <span style={{ color: "#cbd5e1" }}>—</span>
        ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 15, hideOnSinglePage: true }}
      size="small"
    />
  );
}
