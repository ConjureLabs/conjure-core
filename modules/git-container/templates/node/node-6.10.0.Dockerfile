# first installing python, needed during `./configure`
# todo: if user specifies python version, should we handle wiping python first? or install their verison before node?
RUN apt-get install -y python

RUN \
  cd /tmp && \
  curl -o ./node-v6.10.0.tar.gz https://nodejs.org/dist/v6.10.0/node-v6.10.0.tar.gz && \
  tar -xzf ./node-v6.10.0.tar.gz && \
  cd node-v6.10.0 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./node-v6.10.0;
