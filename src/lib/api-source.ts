/** Whether an API request came from somewhere other than our own pages (plugins, other sites). */
export function isExternalRequest(req: Request, appUrl: string) {
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return true;
  try {
    const host = (h: string) => h.replace(/^www\./, "");
    return host(new URL(source).host) !== host(new URL(appUrl).host);
  } catch {
    return true;
  }
}
