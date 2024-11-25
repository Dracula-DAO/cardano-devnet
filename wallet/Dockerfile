FROM ubuntu:noble
RUN apt-get update
RUN apt-get install -y --no-install-recommends build-essential git curl ca-certificates

# Install NVM
ENV NVM_DIR /usr/local/nvm
RUN mkdir -p $NVM_DIR
ENV NODE_VERSION 18.7.0
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN mkdir -p /home/ubuntu/cardano-hw-cli
WORKDIR /home/ubuntu/cardano-hw-cli
COPY ./cardano-hw-cli .

RUN echo $PATH
RUN npm install
RUN npm install -g yarn
RUN yarn clean && yarn install && yarn build-js
RUN ./scripts/build-linux-deb-package.sh
RUN dpkg -i build/linux/deb/cardano-hw-cli_1.16.0-rc.1-1.deb

WORKDIR /home/ubuntu

