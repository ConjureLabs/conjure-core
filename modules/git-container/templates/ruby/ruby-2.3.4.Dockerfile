RUN \
  cd /tmp && \
  curl -o ./ruby-2.3.4.tar.gz https://cache.ruby-lang.org/pub/ruby/2.3/ruby-2.3.4.tar.gz && \
  tar -xzf ./ruby-2.3.4.tar.gz && \
  cd ./ruby-2.3.4 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-2.3.4;
