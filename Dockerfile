FROM node:4.4.0

WORKDIR /usr/src
COPY package.json /usr/src
RUN npm install

COPY bin /usr/src/bin
COPY lib /usr/src/lib
COPY test /usr/src/test
COPY index.js /usr/src

CMD npm test
