FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
# try npm ci (fast/clean); if it fails fall back to npm install for robustness in the build environment
RUN npm ci || npm install --no-audit --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm prune --production
EXPOSE 8098
CMD ["node", "dist/index.js"]
