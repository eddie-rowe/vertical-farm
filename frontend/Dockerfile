FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies using npm ci (faster and more reliable than npm install)
RUN npm ci

# Copy source code after dependencies are installed
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

FROM node:24-alpine
WORKDIR /app

# Create non-root user for security  
RUN addgroup --system --gid 1001 nodegroup && \
    adduser --system --uid 1001 --ingroup nodegroup nextjs

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodegroup /app ./

# Switch to non-root user
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]