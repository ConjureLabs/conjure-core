RUN \
  cd /tmp && \
  curl -o ./Python-2.7.0b4.tgz https://www.python.org/ftp/python/3.7.0/Python-2.7.0b4.tgz && \
  tar -xzf ./Python-2.7.0b4.tgz && \
  cd ./Python-2.7.0b4 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-2.7.0b4;
