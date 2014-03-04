app-directory:
  file.directory:
    - name: /home/{{ pillar['username'] }}/app
    - user: {{ pillar['username'] }}
    - group: {{ pillar['group'] }}
    - mode: 775
    - makedirs: True
