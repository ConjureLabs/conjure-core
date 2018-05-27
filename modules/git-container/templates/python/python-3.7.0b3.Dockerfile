RUN \
  cd /tmp && \
  curl -o ./Python-3.7.0b3.tgz https://www.python.org/ftp/python/3.7.0/Python-3.7.0b3.tgz && \
  tar -xzf ./Python-3.7.0b3.tgz && \
  cd ./Python-3.7.0b3 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-3.7.0b3;
