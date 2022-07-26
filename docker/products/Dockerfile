FROM node:16-alpine as Builder

COPY . /home/app

WORKDIR /home/app

RUN npm install \
    && npm run build:products

FROM node:14-alpine as Executor

WORKDIR /home/app

COPY --chown=node:node --from=Builder /home/app/ /home/app/

ENV NODE_ENV production

EXPOSE 3001

#USER node
USER root

CMD node dist/apps/products/main