# needed for `./configure`
RUN apt-get install -y libxml2-dev

RUN \
  cd /tmp && \
  curl -o ./php-4.3.6.tar.gz http://museum.php.net/php4/php-4.3.6.tar.gz && \
  tar -zxf ./php-4.3.6.tar.gz && \
  cd php-4.3.6 && \
  ./configure && \
  make && \
  make install && \
  cd /tmp && \
  rm -rf ./php-4.3.6;

