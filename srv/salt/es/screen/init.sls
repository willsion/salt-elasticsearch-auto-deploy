screen:
    pkg.installed:
        - name: screen
    file.managed:
        - name: /home/{{pillar['username']}}/.screenrc
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/{{pillar['source-root']}}/screenrc
