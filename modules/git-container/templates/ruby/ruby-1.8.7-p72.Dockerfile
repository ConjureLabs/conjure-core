RUN \
  cd /tmp && \
  curl -o ./ruby-1.8.7-p72.tar.gz https://cache.ruby-lang.org/pub/ruby/1.8/ruby-1.8.7-p72.tar.gz && \
  tar -xzf ./ruby-1.8.7-p72.tar.gz && \
  cd ./ruby-1.8.7-p72 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-1.8.7-p72;
