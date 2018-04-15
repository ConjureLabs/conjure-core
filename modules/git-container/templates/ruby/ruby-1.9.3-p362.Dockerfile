RUN \
  cd /tmp && \
  curl -o ./ruby-1.9.3-p362.tar.gz https://cache.ruby-lang.org/pub/ruby/1.9/ruby-1.9.3-p362.tar.gz && \
  tar -xzf ./ruby-1.9.3-p362.tar.gz && \
  cd ./ruby-1.9.3-p362 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-1.9.3-p362;
