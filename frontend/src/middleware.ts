import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_URL = "https://acc3.k56mm.uk";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const acceptHeader = request.headers.get("accept") || "";
  const isMarkdownRequested = acceptHeader.includes("text/markdown");

  // Markdown negotiation for public landing pages
  if (isMarkdownRequested && (pathname === "/" || pathname === "/home")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.searchParams.set("path", pathname === "/" ? "home" : "home");
    return NextResponse.rewrite(url);
  }

  // Add discovery Link headers to root path
  if (pathname === "/" || pathname === "/home") {
    const response = NextResponse.next();
    response.headers.set(
      "Link",
      `<${BASE_URL}/.well-known/api-catalog>; rel="api-catalog", ` +
        `<${BASE_URL}/.well-known/agent-skills/index.json>; rel="agent-skills"`
    );
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home",
    "/robots.txt",
    "/((?!api|_next|static|favicon.ico).*)",
  ],
};
