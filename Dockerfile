# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source code
COPY . .

COPY .env.production .env.production

# Build the Next.js app
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set correct ownership
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]