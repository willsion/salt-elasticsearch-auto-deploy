base:
  '*':
    - git
    - vim
    - screen
    - appdirectory

  'template:elasticsearch':
    - match: pillar
    - java
    - elasticsearch


  'template:logstash':
    - match: pillar
    - java
    - logstash