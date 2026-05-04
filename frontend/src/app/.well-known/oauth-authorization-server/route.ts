import { NextResponse } from "next/server";

export async function GET() {
  const oauthServer = {
    issuer: "https://acc3.k56mm.uk",
    authorization_endpoint: "https://acc3.k56mm.uk/api/v1/auth/login",
    token_endpoint: "https://acc3.k56mm.uk/api/v1/auth/login",
    refresh_endpoint: "https://acc3.k56mm.uk/api/v1/auth/refresh",
    revocation_endpoint: "https://acc3.k56mm.uk/api/v1/auth/logout",
    jwks_uri: "https://acc3.k56mm.uk/.well-known/jwks.json",
    grant_types_supported: [
      "password",
      "refresh_token",
    ],
    response_types_supported: ["token"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["read", "write"],
    registration_endpoint: "https://acc3.k56mm.uk/api/v1/auth/register",
    service_documentation: "https://acc3.k56mm.uk/api/v1/docs",
    ui_locales_supported: ["th", "en"],
    op_policy_uri: "https://acc3.k56mm.uk/terms",
    op_tos_uri: "https://acc3.k56mm.uk/privacy",
  };

  return NextResponse.json(oauthServer, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
