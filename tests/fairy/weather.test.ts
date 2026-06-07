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

test("asks for a city when a weather question does not name one", () => {
  assert.deepEqual(parseWeatherQuestion("今天天气怎么样？"), {
    isWeatherQuestion: true,
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
