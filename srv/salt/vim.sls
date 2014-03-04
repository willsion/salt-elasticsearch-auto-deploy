vim:
    #pkg.installed:
    file.managed:
        - name: /home/{{pillar['username']}}/.vimrc
        - user: {{ pillar['username'] }}
        - group: {{ pillar['group'] }}
        - source: salt://source/vimrc
