"use client";

import { useState } from "react";
import { Button, InputNumber, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface StoryPriceRow {
  resourceType: "STORY_CHAPTER" | "STORY_TALE";
  resourceKey: string;
  bookId: string;
  chapterIdx: number | null;
  title: string;
  firstChapter: boolean;
  platformCost: number;
  ownerOverride: number | null;
}

const rowKey = (row: StoryPriceRow) => `${row.resourceType}:${row.resourceKey}`;

export function StoryPriceTable({
  rows,
  putUrl,
  mode,
}: {
  rows: StoryPriceRow[];
  putUrl: string;
  mode: "family" | "platform";
}) {
  const [data, setData] = useState<StoryPriceRow[]>(rows);
  const [draft, setDraft] = useState<Record<string, number | null>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const save = async (row: StoryPriceRow) => {
    const key = rowKey(row);
    const next = draft[key] ?? 0;
    setSavingKey(key);
    try {
      const res = await fetch(putUrl, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resourceType: row.resourceType,
          resourceKey: row.resourceKey,
          starsCost: next,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setData((current) =>
        current.map((item) =>
          rowKey(item) === key
            ? mode === "platform"
              ? { ...item, platformCost: next }
              : { ...item, ownerOverride: draft[key] ?? null }
            : item,
        ),
      );
      setDraft((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
      message.success("已保存");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setSavingKey(null);
    }
  };

  const editColumn = {
    title: mode === "platform" ? "平台价格" : "我的价格",
    key: "edit",
    width: 240,
    render: (_: unknown, row: StoryPriceRow) => {
      const key = rowKey(row);
      const dirty = key in draft;
      const fallback = mode === "platform" ? row.platformCost : row.ownerOverride;
      const value = dirty ? draft[key] : fallback;
      return (
        <Space>
          <InputNumber
            min={0}
            max={9999}
            disabled={row.firstChapter}
            placeholder={mode === "family" ? "用默认" : "0"}
            value={value ?? undefined}
            onChange={(next) => setDraft((current) => ({ ...current, [key]: next ?? null }))}
          />
          <Button
            size="small"
            type="primary"
            loading={savingKey === key}
            disabled={!dirty || row.firstChapter}
            onClick={() => save(row)}
          >
            保存
          </Button>
        </Space>
      );
    },
  };

  const columns: ColumnsType<StoryPriceRow> = [
    {
      title: "内容",
      dataIndex: "title",
      key: "title",
      render: (title: string, row) => (
        <span>
          {title}
          {row.firstChapter && <Tag color="green" style={{ marginLeft: 8 }}>首章免费</Tag>}
        </span>
      ),
    },
    {
      title: "平台默认",
      dataIndex: "platformCost",
      key: "platformCost",
      width: 110,
      render: (value: number) => `⭐ ${value}`,
    },
    editColumn,
  ];

  return (
    <Table
      rowKey={rowKey}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 20, hideOnSinglePage: true }}
      size="small"
    />
  );
}
