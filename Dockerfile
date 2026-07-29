FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
