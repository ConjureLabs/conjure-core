RUN \
  cd /tmp && \
  curl -o ./ruby-2.2.9.tar.gz https://cache.ruby-lang.org/pub/ruby/2.2/ruby-2.2.9.tar.gz && \
  tar -xzf ./ruby-2.2.9.tar.gz && \
  cd ./ruby-2.2.9 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-2.2.9;
