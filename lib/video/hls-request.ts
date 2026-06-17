export function createNoReferrerHlsRequest(
  url: string,
  init: RequestInit,
): Request {
  return new Request(url, {
    ...init,
    referrer: "",
    referrerPolicy: "no-referrer",
  });
}
