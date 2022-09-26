FROM node:14-alpine
# Create app directory
WORKDIR /app
# Install app dependencies
RUN npm install dotenv \
    && npm install --save cors --registry=https://registry.npm.taobao.org \
    && npm i -g nodemon
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#COPY yarn*.lock ./
RUN yarn

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
WORKDIR /app
RUN cp ./.env.default ./.env
#RUN cd ui && yarn && yarn build

EXPOSE 3003
CMD [ "yarn", "start" ]
