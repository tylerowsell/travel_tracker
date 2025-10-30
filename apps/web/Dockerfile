FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npm", "run", "dev"]
