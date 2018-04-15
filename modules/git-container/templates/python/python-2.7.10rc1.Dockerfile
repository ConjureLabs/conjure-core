RUN \
  cd /tmp && \
  curl -o ./Python-2.7.10rc1.tgz https://www.python.org/ftp/python/2.7.10/Python-2.7.10rc1.tgz && \
  tar -xzf ./Python-2.7.10rc1.tgz && \
  cd ./Python-2.7.10rc1 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-2.7.10rc1;
