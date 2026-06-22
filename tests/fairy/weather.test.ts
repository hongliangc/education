import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { formatWeatherReply, parseWeatherQuestion } from "../../lib/weather/fairy-weather.ts";

test("extracts an explicitly named city from common weather questions", () => {
  assert.deepEqual(parseWeatherQuestion("北京今天天气怎么样？"), {
    isWeatherQuestion: true,
    city: "北京",
  });
  assert.deepEqual(parseWeatherQuestion("今天上海会下雨吗"), {
    isWeatherQuestion: true,
    city: "上海",
  });
  assert.deepEqual(parseWeatherQuestion("广州现在热不热？"), {
    isWeatherQuestion: true,
    city: "广州",
  });
});

test("strips time words and still extracts the city", () => {
  assert.deepEqual(parseWeatherQuestion("深圳明天会下雨吗？"), {
    isWeatherQuestion: true,
    city: "深圳",
  });
});

test("falls through to the model when no clean city is named", () => {
  // 不再追问城市，也不会把句子残余当城市——交 LLM 自然回应。
  assert.deepEqual(parseWeatherQuestion("今天天气怎么样？"), {
    isWeatherQuestion: false,
  });
  assert.deepEqual(parseWeatherQuestion("会下雨吗"), {
    isWeatherQuestion: false,
  });
});

test("does not intercept explanatory questions that mention weather words", () => {
  // 回归：含天气词的「为什么/怎么形成」类问题曾被当成城市查询，回出「找不到城市」。
  assert.deepEqual(parseWeatherQuestion("为什么会下雨？"), {
    isWeatherQuestion: false,
  });
  assert.deepEqual(parseWeatherQuestion("温度是怎么来的？"), {
    isWeatherQuestion: false,
  });
});

test("does not intercept unrelated fairy questions", () => {
  assert.deepEqual(parseWeatherQuestion("为什么天空是蓝色的？"), {
    isWeatherQuestion: false,
  });
});

test("formats live weather facts without asking the language model to guess", () => {
  assert.equal(
    formatWeatherReply({
      city: "北京",
      weatherCode: 1,
      temperature: 26.4,
      apparentTemperature: 27.1,
      temperatureMax: 30.2,
      temperatureMin: 19.8,
      precipitationProbability: 20,
    }),
    "北京现在大致晴朗，约 26°C，体感 27°C。今天 20～30°C，最高降雨概率 20%。出门前再看看天空，和爸爸妈妈一起选合适的衣服吧！☀️",
  );
});
