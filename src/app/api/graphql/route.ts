/**
 * GraphQL API Route for Thai Accounting ERP
 * Phase D: API Mastery - GraphQL Layer
 *
 * Endpoint: /api/graphql
 * Features:
 * - Apollo Server integration
 * - Authentication middleware
 * - DataLoader for N+1 prevention
 * - Query complexity limiting
 * - GraphQL Playground in development
 */

import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { createDataLoaders } from '@/lib/graphql/dataloaders';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GraphQLError } from 'graphql';
import { NextRequest } from 'next/server';

// Maximum query complexity to prevent abuse
const MAX_QUERY_COMPLEXITY = 1000;
const MAX_QUERY_DEPTH = 10;

/**
 * Calculate query complexity (simplified)
 */
function calculateComplexity(query: string): number {
  let complexity = 0;

  // Count fields (each field adds complexity)
  const fieldMatches = query.match(/\w+(?=\s*[{:\(])/g) || [];
  complexity += fieldMatches.length * 1;

  // Count nested selections (deeper nesting = more complexity)
  const depth = (query.match(/{/g) || []).length;
  complexity += depth * 5;

  // Connection queries are more expensive
  if (query.includes('Connection')) {
    complexity += 10;
  }

  return complexity;
}

/**
 * Check query depth
 */
function calculateDepth(query: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of query) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth--;
    }
  }

  return maxDepth;
}

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers: resolvers as any,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    // Don't leak internal errors in production
    if (process.env.NODE_ENV === 'production') {
      if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return new GraphQLError('Internal server error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    }
    return error;
  },
});

// Create handler
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    // Get client IP
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check query complexity before processing
    const body = await req
      .clone()
      .json()
      .catch(() => ({}));
    if (body.query) {
      const complexity = calculateComplexity(body.query);
      const depth = calculateDepth(body.query);

      if (complexity > MAX_QUERY_COMPLEXITY) {
        throw new GraphQLError(`Query too complex: ${complexity} (max: ${MAX_QUERY_COMPLEXITY})`, {
          extensions: { code: 'QUERY_TOO_COMPLEX' },
        });
      }

      if (depth > MAX_QUERY_DEPTH) {
        throw new GraphQLError(`Query too deep: ${depth} (max: ${MAX_QUERY_DEPTH})`, {
          extensions: { code: 'QUERY_TOO_DEEP' },
        });
      }
    }

    // Get session from NextAuth
    const session = await auth();

    return {
      user: session?.user
        ? {
            id: session.user.id as string,
            email: session.user.email as string,
            role: session.user.role as string,
          }
        : undefined,
      loaders: createDataLoaders(),
      ipAddress: ipAddress.toString(),
      userAgent,
    };
  },
});

// Export route handlers
export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

// Disable body parsing for Apollo
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
