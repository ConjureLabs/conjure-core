#### YML configuration


#### Machine configuration

```yml
environment:
  key: val
languages:
  node:
    version: 6.10.0
  ruby:
    version: 2.4.1
port: 3000
pre:
  - command
  - command
run:
  override:
    - ABC=12 npm start
```
