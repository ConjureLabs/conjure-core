RUN \
  cd /tmp && \
  curl -o ./ruby-2.1.5.tar.gz https://cache.ruby-lang.org/pub/ruby/2.1/ruby-2.1.5.tar.gz && \
  tar -xzf ./ruby-2.1.5.tar.gz && \
  cd ./ruby-2.1.5 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-2.1.5;
