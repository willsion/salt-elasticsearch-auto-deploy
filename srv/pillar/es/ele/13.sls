template:
  - elasticsearch
template_type:
  - template: es-template-one
    type: elasticsearch
role:
  - http
  - datanode
  - masternode
cluster:
  - opsdev
es-template-one_conf:
  - deploy_path: /etc/security/limits.d/
    name: 90-nproc.conf
  - deploy_path: /etc/security/
    name: limits.conf
  - name: elasticsearch.yml
  - name: logging.yml
  - deploy_path: /home/op1/app/elasticsearch/bin/
    name: elasticsearch.in.sh

