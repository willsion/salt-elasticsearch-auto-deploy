base:
  '*':
    - es.user
    - es.app

  "192.168.81.129":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.ele.21
  "192.168.81.149":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.es-template-one.role.masternode
    - es.ele.13
  "192.168.81.150":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.19
  "192.168.81.151":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.20
  "192.168.81.156":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.16
  "192.168.81.196":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.18
  "192.168.81.208":
    - es.es-te-two.template.es-te-two
    - es.es-te-two.cluster.208-test
    - es.es-te-two.role.masternode
    - es.es-te-two.role.http
    - es.logstash-template-one.template.logstash-template-one
    - es.logstash-template-one.cluster.logstash-test
    - es.logstash-template-one.role.role
    - es.ele.12
  "VMS01899":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.17
  "VMS01900":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.15
  "VMS01901":
    - es.es-template-one.template.es-template-one
    - es.es-template-one.cluster.opsdev
    - es.es-template-one.role.http
    - es.es-template-one.role.datanode
    - es.ele.23
