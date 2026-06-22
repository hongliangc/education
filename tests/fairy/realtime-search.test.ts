import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { formatSearchReply, parseRealtimeQuestion } from "../../lib/search/fairy-search.ts";

test("recognizes nearby places and changing place information", () => {
  assert.deepEqual(parseRealtimeQuestion("北京朝阳区附近有什么游乐园？"), {
    isRealtimeQuestion: true,
    locationRequired: true,
    hasLocation: true,
  });
  assert.deepEqual(parseRealtimeQuestion("上海迪士尼今天几点关门？"), {
    isRealtimeQuestion: true,
    locationRequired: true,
    hasLocation: true,
  });
  assert.deepEqual(parseRealtimeQuestion("杭州西湖附近有什么商场"), {
    isRealtimeQuestion: true,
    locationRequired: true,
    hasLocation: true,
  });
});

test("asks for a location for nearby searches without one", () => {
  assert.deepEqual(parseRealtimeQuestion("附近有什么游乐园？"), {
    isRealtimeQuestion: true,
    locationRequired: true,
    hasLocation: false,
  });
});

test("allows current web questions that pair recency with a current-events noun", () => {
  assert.deepEqual(parseRealtimeQuestion("最近有什么新的恐龙发现？"), {
    isRealtimeQuestion: true,
    locationRequired: false,
    hasLocation: false,
  });
  assert.deepEqual(parseRealtimeQuestion("今天有什么新闻？"), {
    isRealtimeQuestion: true,
    locationRequired: false,
    hasLocation: false,
  });
});

test("does not intercept everyday chat that merely contains a recency word", () => {
  // 回归：「最近/最新」单独出现曾误判为联网搜索。
  for (const q of ["我最近学了拼音", "最近天气真好", "你最近怎么样呀"]) {
    assert.deepEqual(parseRealtimeQuestion(q), {
      isRealtimeQuestion: false,
      locationRequired: false,
      hasLocation: false,
    });
  }
});

test("leaves stable learning questions on the normal model path", () => {
  assert.deepEqual(parseRealtimeQuestion("为什么天空是蓝色的？"), {
    isRealtimeQuestion: false,
    locationRequired: false,
    hasLocation: false,
  });
});

test("formats search results with compact source links", () => {
  assert.equal(
    formatSearchReply("北京朝阳区附近有什么游乐园？", [
      {
        title: "欢乐谷官方网站",
        url: "https://example.com/park",
        content: "北京欢乐谷位于朝阳区，开放时间可能按日期调整。",
      },
      {
        title: "朝阳公园",
        url: "https://example.com/park-2",
        content: "朝阳公园内有适合儿童的游乐设施。",
      },
    ]),
    "我查到这些信息：\n1. 欢乐谷官方网站：北京欢乐谷位于朝阳区，开放时间可能按日期调整。\n2. 朝阳公园：朝阳公园内有适合儿童的游乐设施。\n信息可能会变化，出发前请和爸爸妈妈查看来源确认哦！\n来源：https://example.com/park https://example.com/park-2",
  );
});
