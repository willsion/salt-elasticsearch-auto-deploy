limits:
    cmd.run:
        - name: echo -e "#added by salt for es\n* - nofile 131072\n* - memlock unlimited\n* - sigpending 65536\n#end by salt for es" >> /etc/security/limits.conf
        - user: root 
        - unless: grep "#added by salt for es" /etc/security/limits.conf

nproc:
    cmd.run:
        - name: echo -e "#added by salt for es\n* soft nproc 8096\nroot soft nproc unlimited\n#end by salt for es" >> /etc/security/limits.d/90-nproc.conf 
        - user: root 
        - unless: grep "#added by salt for es" /etc/security/limits.d/90-nproc.conf 
