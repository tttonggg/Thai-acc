FROM node:20-alpine

WORKDIR /app

# Copy the prebuilt standalone output (built locally before deploy)
# Next.js standalone preserves the relative path from project root
COPY .next/standalone/peak-acc/frontend ./
COPY .next/static ./.next/static
COPY public ./public

ENV NEXT_PUBLIC_API_URL=/api/v1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
