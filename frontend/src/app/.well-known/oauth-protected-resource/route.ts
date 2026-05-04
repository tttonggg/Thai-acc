import { NextResponse } from "next/server";

export async function GET() {
  const protectedResource = {
    resource: "https://acc3.k56mm.uk/api/v1",
    authorization_servers: [],
    bearer_methods: [
      {
        scheme: "Bearer",
        description: "JWT Bearer token authentication",
        token_endpoint: "https://acc3.k56mm.uk/api/v1/auth/login",
        refresh_endpoint: "https://acc3.k56mm.uk/api/v1/auth/refresh",
        documentation: "https://acc3.k56mm.uk/api/v1/docs",
      },
    ],
    scopes_supported: ["read", "write"],
    hints: {
      "auth-type": "bearer-jwt",
      "token-location": "Authorization header",
      "token-format": "JWT (HS256)",
    },
  };

  return NextResponse.json(protectedResource, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
