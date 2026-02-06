FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_CHAT_API_URL
ARG VITE_CLAIM_API_URL
ARG VITE_API_URL

ENV VITE_CHAT_API_URL=$VITE_CHAT_API_URL
ENV VITE_CLAIM_API_URL=$VITE_CLAIM_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
