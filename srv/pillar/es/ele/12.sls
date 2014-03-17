template:
  - elasticsearch
  - logstash
template_type:
  - template: logstash-template-one
    type: logstash
  - template: es-te-two
    type: elasticsearch
role:
  - masternode
  - role
  - http
cluster:
  - 208-test
  - logstash-test
es-te-two_conf:
  - deploy_path: /etc/security/limits.d/
    name: 90-nproc.conf
  - deploy_path: /etc/security/
    name: limits.conf
  - name: elasticsearch.yml
  - name: logging.yml
  - deploy_path: /home/op1/app/elasticsearch/bin/
    name: elasticsearch.in.sh
logstash-template-one_conf:
  - name: test

