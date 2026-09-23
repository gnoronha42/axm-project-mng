FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
COPY server/prisma ./prisma
RUN npm ci

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV KNOWLEDGE_DIR=/app/knowledge/suframa
COPY --from=deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/prisma ./prisma
COPY server/tsconfig.json ./
COPY server/src ./src
COPY knowledge ./knowledge
RUN npx prisma generate
RUN mkdir -p uploads
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && npx tsx src/index.ts"]
