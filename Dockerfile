# multistage build

FROM node:22 AS base
# FROM node:current AS base
# FROM node:lts AS base
COPY . /app

WORKDIR /app

RUN npm install && npm run build

FROM httpd:2.4 AS runtime

COPY --from=base /app/dist /usr/local/apache2/htdocs/
