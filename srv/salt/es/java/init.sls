java-file:
    file.managed:
        - name: /home/{{pillar['username']}}/app/jdk-7u51-linux-x64.rpm
        - mode: 777
        - makedirs: True
        - source: salt://source/{{pillar['source-root']}}/package//jdk-7u51-linux-x64.rpm
    cmd.run:
        - cwd: /home/{{pillar['username']}}/app
        - name: sudo rpm -ivh jdk-7u51-linux-x64.rpm; sudo rm -rf /usr/bin/java; sudo ln -s /usr/java/default/bin/java  /usr/bin/java
        - user: {{ pillar['username'] }}
        - require:
            - file: java-file
