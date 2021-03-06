RUN \
  cd /tmp && \
  curl -o ./Python-3.7.0a1.tgz https://www.python.org/ftp/python/3.7.0/Python-3.7.0a1.tgz && \
  tar -xzf ./Python-3.7.0a1.tgz && \
  cd ./Python-3.7.0a1 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-3.7.0a1;
