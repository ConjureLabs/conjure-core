# first installing python, needed during `./configure`
# todo: if user specifies python version, should we handle wiping python first? or install their verison before node?
RUN apt-get install -y python

RUN \
  cd /tmp && \
  curl -o ./node-v9.2.1.tar.gz https://nodejs.org/dist/v9.2.1/node-v9.2.1.tar.gz && \
  tar -xzf ./node-v9.2.1.tar.gz && \
  cd node-v9.2.1 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./node-v9.2.1;
