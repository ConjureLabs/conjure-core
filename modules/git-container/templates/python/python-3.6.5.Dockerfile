RUN \
  cd /tmp && \
  curl -o ./Python-3.6.5.tgz https://www.python.org/ftp/python/3.6.5/Python-3.6.5.tgz && \
  tar -xzf ./Python-3.6.5.tgz && \
  cd ./Python-3.6.5 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./Python-3.6.5;
