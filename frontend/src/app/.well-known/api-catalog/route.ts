import { NextResponse } from "next/server";

export async function GET() {
  const linkset = {
    linkset: [
      {
        anchor: "https://acc3.k56mm.uk/api/v1",
        rel: "api",
        type: "application/json",
        href: "/api/v1",
      },
      {
        anchor: "https://acc3.k56mm.uk/api/v1/docs",
        rel: "documentation",
        type: "text/html",
        href: "/api/v1/docs",
      },
      {
        anchor: "https://acc3.k56mm.uk/api/v1/openapi.json",
        rel: "service-desc",
        type: "application/json",
        href: "/api/v1/openapi.json",
      },
      {
        anchor: "https://acc3.k56mm.uk/.well-known/mcp/server-card.json",
        rel: "mcp-server-card",
        type: "application/json",
        href: "/.well-known/mcp/server-card.json",
      },
      {
        anchor: "https://acc3.k56mm.uk/.well-known/agent-skills/index.json",
        rel: "agent-skills",
        type: "application/json",
        href: "/.well-known/agent-skills/index.json",
      },
      {
        anchor: "https://acc3.k56mm.uk/.well-known/oauth-protected-resource",
        rel: "oauth-protected-resource",
        type: "application/json",
        href: "/.well-known/oauth-protected-resource",
      },
      {
        anchor: "https://acc3.k56mm.uk/.well-known/oauth-authorization-server",
        rel: "oauth-authorization-server",
        type: "application/json",
        href: "/.well-known/oauth-authorization-server",
      },
      {
        anchor: "https://acc3.k56mm.uk/api/v1/health",
        rel: "status",
        type: "application/json",
        href: "/api/v1/health",
      },
    ],
  };

  return NextResponse.json(linkset, {
    headers: {
      "Content-Type": "application/linkset+json",
    },
  });
}
