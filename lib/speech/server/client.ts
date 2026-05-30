import "server-only";
// 子包内部版本目录名随版本变化，已对照 v4.1.237 确认：tts.v20190823 / asr.v20190614
import * as ttsSdk from "tencentcloud-sdk-nodejs-tts";
import * as asrSdk from "tencentcloud-sdk-nodejs-asr";

const SECRET_ID = process.env.TENCENT_SECRETID;
const SECRET_KEY = process.env.TENCENT_SECRETKEY;
const REGION = process.env.TENCENT_REGION ?? "ap-guangzhou";

export function isSpeechConfigured(): boolean {
  return !!SECRET_ID && !!SECRET_KEY;
}

function credential() {
  return {
    credential: { secretId: SECRET_ID!, secretKey: SECRET_KEY! },
    region: REGION,
    profile: { httpProfile: { reqTimeout: 15 } },
  };
}

export function ttsClient() {
  const Client = ttsSdk.tts.v20190823.Client;
  return new Client(credential());
}

export function asrClient() {
  const Client = asrSdk.asr.v20190614.Client;
  return new Client(credential());
}
