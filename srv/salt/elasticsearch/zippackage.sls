es-bin:
    file.managed:
        - name: /home/{{pillar['username']}}/app/elasticsearch-{{pillar['es-version']}}.zip
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/package/elasticsearch-{{pillar['es-version']}}.zip
        #- source_hash: f082d8ba2795a0ca63f58cc8bb32a9dc
    cmd.run:
        - cwd: /home/{{pillar['username']}}/app
        - name: rm -rf elasticsearch; unzip  -oq elasticsearch-{{pillar['es-version']}}.zip; ln -s elasticsearch-{{pillar['es-version']}} elasticsearch ; rm elasticsearch-{{pillar['es-version']}}.zip;
        - unless: test -d /home/{{pillar['username']}}/app/elasticsearch-{{pillar['es-version']}}
        - user: {{ pillar['username'] }}
        - require:
            - file: es-bin


es-log:
  file.directory:
    - name: /var/log/elasticsearch/
    - user: {{ pillar['username'] }}
    - group: {{ pillar['group'] }}
    - mode: 774
    - makedirs: True
    - require:
        - file: es-bin

es-data:
  file.directory:
    - name: /var/data/elasticsearch/
    - user: {{ pillar['username'] }}
    - group: {{ pillar['group'] }}
    - mode: 774
    - makedirs: True
    - require:
        - file: es-bin


{% for item in pillar['elasticsearch_conf']%} 
elasticsearch-conf-files_{{item.name}}:
    file.managed:
        - name: {{item.deploy_path |default("/home/" + pillar['username'] + "/app/elasticsearch-" + pillar['es-version'] + "/config/")}}/{{item.name}}
        - mode: 777
        - template: jinja
        - source: salt://source/elasticsearch/{{item.name}}
{% endfor %}

es-config-logging:
    file.managed:
        - name: /home/{{pillar['username']}}/app/elasticsearch-{{pillar['es-version']}}/config/logging.yml
        - template: jinja
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/elasticsearch/logging.yml.jinja

es-template-dir:
  file.directory:
    - name: /home/{{pillar['username']}}/app/elasticsearch-{{pillar['es-version']}}/config/templates
    - user: {{ pillar['username'] }}
    - group: {{ pillar['group'] }}
    - mode: 774
    - makedirs: True

es-templates-files:
    file.recurse:
        - name: {{ pillar['app-directory'] }}/elasticsearch-{{pillar['es-version']}}/config/templates
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/elasticsearch/templates

#es-service:
#  cmd.run:
#    - cwd: /home/{{ pillar['username'] }}/app/elasticsearch-{{pillar['es-version']}}
#    - name: bin/elasticsearch
#    - user: {{ pillar['username'] }}
#    - unless: ps -ef |grep elasticsearch | grep -v grep


es-start:
    file.managed:
        - name: /etc/init.d/elasticsearch
        - template: jinja
        - mode: 777
        - source: salt://source/elasticsearch/elasticsearch