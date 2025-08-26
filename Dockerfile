FROM node:alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install 

COPY . .

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/index.js"]