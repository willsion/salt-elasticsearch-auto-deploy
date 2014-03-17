es-bin:
    file.managed:
        - name: /home/{{pillar['username']}}/app/elasticsearch-{{pillar['es-version']}}.zip
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/{{pillar['source-root']}}/package/elasticsearch-{{pillar['es-version']}}.zip
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

{% for item in pillar['template_type']%}
{% if item.type == "elasticsearch" %}
{% for conf_item in pillar[ item.template + '_conf']%} 
elasticsearch-conf-files_{{conf_item.name}}:
    file.managed:
        - name: {{conf_item.deploy_path |default("/home/" + pillar['username'] + "/app/elasticsearch-" + pillar['es-version'] + "/config/")}}/{{conf_item.name}}
        - mode: 777
        - template: jinja
        - source: salt://source/{{pillar['source-root']}}/{{item.type}}/{{item.template}}/{{conf_item.name}}
{% endfor %}
{% endif %}
{% endfor %}

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
        - source: salt://source/{{pillar['source-root']}}/es_common_!/templates



es-start:
    file.managed:
        - name: /etc/init.d/elasticsearch
        - template: jinja
        - mode: 777
        - source: salt://source/{{pillar['source-root']}}/es_common_!/elasticsearch
