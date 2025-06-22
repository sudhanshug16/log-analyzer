import { serve } from "bun";

function contentType(path: string): string | undefined {
  if (path.endsWith(".js")) return "text/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".map")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return undefined;
}

serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = `dist${pathname}`;
    const file = Bun.file(filePath);
    if (!file.exists()) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(file.stream(), {
      headers: contentType(pathname)
        ? { "Content-Type": contentType(pathname)! }
        : undefined,
    });
  },
});

console.log("🌐 Static site served at http://localhost:3000");
