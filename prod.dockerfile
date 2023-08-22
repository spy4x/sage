# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.4.0
ARG PNPM_VERSION=8.6.7

FROM node:${NODE_VERSION}-alpine as base

WORKDIR /app

RUN npm install -g pnpm@${PNPM_VERSION}

FROM base as deps

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --prod --frozen-lockfile --ignore-scripts


FROM deps as build

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .

#To make it build without openai api key
ENV OPENAI_API_KEY=sk-fake

RUN pnpm run build

FROM deps as final

RUN npm uninstall -g pnpm

USER node
ENV NODE_ENV production

COPY package.json .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build

CMD node build/index.js
