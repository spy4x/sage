# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.4.0
ARG PNPM_VERSION=8.6.7

FROM node:${NODE_VERSION}-alpine as base

WORKDIR /app

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./

RUN pnpm i --ignore-scripts

COPY . .

ENV NODE_ENV development

CMD pnpm dev:local
