# needed for `./configure`
RUN apt-get install -y libxml2-dev

RUN \
  cd /tmp && \
  curl -o ./php-7.1.3.tar.gz http://www.php.net/distributions/php-7.1.3.tar.gz && \
  tar -zxf ./php-7.1.3.tar.gz && \
  cd php-7.1.3 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./php-7.1.3;

