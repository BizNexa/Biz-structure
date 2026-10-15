FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY app.js cashfree.js server.js store.js ./
COPY private/catalog.json private/catalog.json
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
