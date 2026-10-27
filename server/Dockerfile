FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.js ./
COPY src ./src
# Maintenance scripts (npm run seed) for use with docker compose exec.
COPY scripts ./scripts
RUN mkdir -p uploads/profiles && chown -R node:node uploads

# Run as an unprivileged user.
USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
