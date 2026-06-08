"use client";

import { useState } from "react";
import { Button, Drawer, Form, Input, InputNumber, Popconfirm, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface RewardRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  starsCost: number;
  stock: number | null;
  isActive: boolean;
}

interface RewardFormValues {
  title: string;
  description?: string;
  imageUrl?: string;
  starsCost: number;
  stock?: number | null;
}

export function RewardEditor({ rewards, baseUrl }: { rewards: RewardRow[]; baseUrl: string }) {
  const [data, setData] = useState<RewardRow[]>(rewards);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RewardRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<RewardFormValues>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ starsCost: 10, stock: undefined });
    setOpen(true);
  };

  const openEdit = (row: RewardRow) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      description: row.description ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      starsCost: row.starsCost,
      stock: row.stock ?? undefined,
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await fetch(editing ? `${baseUrl}/${editing.id}` : baseUrl, {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("save_failed");
      const reward = (await res.json()).reward as RewardRow;
      setData((current) =>
        editing ? current.map((r) => (r.id === reward.id ? reward : r)) : [reward, ...current],
      );
      setOpen(false);
      message.success("已保存");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: RewardRow) => {
    try {
      const res = await fetch(`${baseUrl}/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setData((current) => current.map((r) => (r.id === row.id ? { ...r, isActive: false } : r)));
      message.success("已下架");
    } catch {
      message.error("操作失败");
    }
  };

  const columns: ColumnsType<RewardRow> = [
    {
      title: "奖励",
      dataIndex: "title",
      key: "title",
      render: (title: string, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          {row.description && <span style={{ color: "#94a3b8", fontSize: 12 }}>{row.description}</span>}
        </Space>
      ),
    },
    { title: "星星", dataIndex: "starsCost", key: "starsCost", width: 90, render: (v: number) => `⭐ ${v}` },
    { title: "库存", dataIndex: "stock", key: "stock", width: 90, render: (v: number | null) => (v === null ? "不限" : v) },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      width: 90,
      render: (active: boolean) => (active ? <Tag color="green">上架</Tag> : <Tag>下架</Tag>),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      render: (_: unknown, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          {row.isActive && (
            <Popconfirm title="确定下架这个奖励？" onConfirm={() => remove(row)}>
              <Button size="small" danger>
                下架
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={openCreate}>
          + 新增奖励
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        size="small"
      />
      <Drawer
        title={editing ? "编辑奖励" : "新增奖励"}
        open={open}
        onClose={() => setOpen(false)}
        width={380}
        extra={
          <Button type="primary" loading={saving} onClick={submit}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea maxLength={280} rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="图片地址">
            <Input maxLength={500} placeholder="可选" />
          </Form.Item>
          <Form.Item name="starsCost" label="需要星星" rules={[{ required: true, message: "请输入星星数" }]}>
            <InputNumber min={0} max={9999} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="stock" label="库存（留空 = 不限）">
            <InputNumber min={0} max={9999} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
