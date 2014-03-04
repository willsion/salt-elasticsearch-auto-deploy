logstash-jar-file:
    file.managed:
        - name: /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}}/logstash-{{pillar['ls-version']}}-flatjar.jar
        - mode: 777
        - makedirs: True
        - source: salt://source/logstash/logstash-{{pillar['ls-version']}}-flatjar.jar
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
        - source: salt://source/logstash/elasticsearch.yml

logstash-conf-folder:
  file.directory:
    - name: /home/{{pillar['username']}}/app/logstash-{{pillar['ls-version']}}/conf
    - mode: 777
    - makedirs: True


{% for item in pillar['logstash_conf']%} 
logstash-conf-files_{{item.name}}:
    file.managed:
        - name: {{item.deploy_path |default("/home/" + pillar['username'] + "/app/logstash-" + pillar['ls-version'] + "/conf/")}}/{{item.name}}
        - mode: 777
        - template: jinja
        - source: salt://source/logstash/conf/{{item.name}}
{% endfor %}

lg-log:
  file.directory:
    - name: /var/log/logstash/
    - mode: 777
    - makedirs: True
