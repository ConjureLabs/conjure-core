RUN \
  cd /tmp && \
  curl -o ./Python-3.4.2rc1.tgz https://www.python.org/ftp/python/3.4.2/Python-3.4.2rc1.tgz && \
  tar -xzf ./Python-3.4.2rc1.tgz && \
  cd ./Python-3.4.2rc1 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-3.4.2rc1;
