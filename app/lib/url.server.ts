export function publicBaseUrl(request: Request): string {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  return `${url.protocol}//${host}`;
}
