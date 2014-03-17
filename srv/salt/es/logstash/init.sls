logstash-jar-file:
    file.managed:
        - name: /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}}/logstash-{{pillar['ls-version']}}-flatjar.jar
        - mode: 777
        - makedirs: True
        - source: salt://source/{{pillar['source-root']}}/package/logstash-{{pillar['ls-version']}}-flatjar.jar
    cmd.run:
        - cwd: /home/{{pillar['username']}}/app
        - name: rm -rf logstash; ln -s /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}} logstash
        - user: {{ pillar['username'] }}
        - require:
            - file: logstash-jar-file


lg-conf-file:
    file.managed:
        - name: /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}}/elasticsearch.yml
        - mode: 777
        - source: salt://source/{{pillar['source-root']}}/logstash_common_!/elasticsearch.yml

logstash-conf-folder:
  file.directory:
    - name: /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}}/conf
    - mode: 777
    - makedirs: True


{% for item in pillar['template_type']%}
{% if item.type == "logstash" %}
{% for conf_item in pillar[ item.template + '_conf']%} 
elasticsearch-conf-files_{{conf_item.name}}:
    file.managed:
        - name: {{conf_item.deploy_path |default("/home/" + pillar['username'] + "/app/logstash-" + pillar['es-version'] + "/conf/")}}/{{conf_item.name}}
        - mode: 777
        - template: jinja
        - source: salt://source/{{pillar['source-root']}}/{{item.type}}/{{item.template}}/{{conf_item.name}}
{% endfor %}
{% endif %}
{% endfor %}


lg-log:
  file.directory:
    - name: /var/log/logstash/
    - mode: 777
    - makedirs: True
