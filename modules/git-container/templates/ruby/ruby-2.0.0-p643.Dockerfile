RUN \
  cd /tmp && \
  curl -o ./ruby-2.0.0-p643.tar.gz https://cache.ruby-lang.org/pub/ruby/2.0/ruby-2.0.0-p643.tar.gz && \
  tar -xzf ./ruby-2.0.0-p643.tar.gz && \
  cd ./ruby-2.0.0-p643 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-2.0.0-p643;
