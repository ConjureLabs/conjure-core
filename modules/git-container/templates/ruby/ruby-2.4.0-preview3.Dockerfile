RUN \
  cd /tmp && \
  curl -o ./ruby-2.4.0-preview3.tar.gz https://cache.ruby-lang.org/pub/ruby/2.4/ruby-2.4.0-preview3.tar.gz && \
  tar -xzf ./ruby-2.4.0-preview3.tar.gz && \
  cd ./ruby-2.4.0-preview3 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./ruby-2.4.0-preview3;
