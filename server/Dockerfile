FROM node:20-alpine

# Sharp dependencies (libvips)
RUN apk add --no-cache \
    vips-dev \
    fftw-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    g++ \
    make \
    python3

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
