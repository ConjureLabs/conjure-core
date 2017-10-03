<p align="center">
  <strong>c o n j u r e</strong>
  <kbd>⎔</kbd>
  <strong>c o r e</strong>
</p>

# Conjure Core

The heart of the beast

## RabbitMQ

On MacOS? [Install it via homebrew](https://www.rabbitmq.com/install-homebrew.html).

Then, run it locally via `PATH=$PATH:/usr/local/sbin rabbitmq-server`.

Once running, you can close that tab if wanted, and it should run in the background.

If you try starting it again, and get an error of `ERROR: node with name "rabbit" already running on "localhost"`, then you're already set.

### Web Dashboard

It helps to use the [built-in management plugin](https://www.rabbitmq.com/management.html) to monitor activity.

First, make sure it's enabled. `PATH=$PATH:/usr/local/sbin rabbitmq-plugins enable rabbitmq_management`

Then, you can go to [http://localhost:15672/](http://localhost:15672/).
