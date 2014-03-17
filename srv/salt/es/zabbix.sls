es_monitor_conf:
    file.managed:
        - name: /etc/zabbix/zabbix_agentd.d/es_monitor.conf
        - template: jinja
        - mode: 777
        - source: salt://source/{{pillar['source-root']}}/es_jvm/es_monitor.conf

es_monitors_py:
    file.managed:
        - name: /usr/local/zabbix/external-script/es_monitors.py
        - template: jinja
        - mode: 777
        - source: salt://source/{{pillar['source-root']}}/es_jvm/es_monitors.py
