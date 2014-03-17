base:
  '*':
    - es.git
    - es.vim
    - es.screen

  'template:elasticsearch':
    - match: pillar
    - es.appdirectory
    - es.java
    - es.elasticsearch


  'template:logstash':
    - match: pillar
    - es.appdirectory
    - es.java
    - es.logstash
