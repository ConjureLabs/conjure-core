# first installing python, needed during `./configure`
# todo: if user specifies python version, should we handle wiping python first? or install their verison before node?
RUN apt-get install -y python

RUN \
  cd /tmp && \
  curl -o ./node-v4.7.3.tar.gz https://nodejs.org/dist/v4.7.3/node-v4.7.3.tar.gz && \
  tar -xzf ./node-v4.7.3.tar.gz && \
  cd node-v4.7.3 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./node-v4.7.3;
