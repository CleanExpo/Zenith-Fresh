# Build stage
FROM node:18.20.8-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps
RUN npm install lucide-react
RUN npm install @radix-ui/react-select
RUN npm install prom-client
RUN npm install --save-dev @types/prom-client
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 