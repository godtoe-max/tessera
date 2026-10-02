import { verifyRequestOrigin as verifyIdentityOrigin } from "@netlify/identity";

// Netlify's Next.js handler may use an internal URL behind its proxy. Trust
// deployment origins supplied by the platform, never arbitrary request headers.
export function verifyRequestOrigin(request: Request) {
  const allowedOrigins = [request.url, process.env.URL, process.env.DEPLOY_URL, process.env.DEPLOY_PRIME_URL]
    .filter((value): value is string => Boolean(value))
    .map(value => new URL(value).origin);
  verifyIdentityOrigin(request, { allowedOrigins });
}

