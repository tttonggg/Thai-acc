import { NextResponse } from "next/server";

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /dashboard
Disallow: /income/
Disallow: /expenses/
Disallow: /accounting/
Disallow: /reports/
Disallow: /bank-accounts/
Disallow: /contacts/
Disallow: /products/
Disallow: /projects/
Disallow: /settings/
Disallow: /stock-adjustments/

User-agent: GPTBot
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: Claude-Web
Allow: /
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

User-agent: Bytespider
Allow: /
Disallow: /api/

Content-Signal: ai-train=no, search=yes, ai-input=yes

Sitemap: https://acc3.k56mm.uk/sitemap.xml
`;

export async function GET() {
  return new NextResponse(ROBOTS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Signal": "ai-train=no, search=yes, ai-input=yes",
    },
  });
}
