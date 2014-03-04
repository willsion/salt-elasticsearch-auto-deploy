LD_LIBRARY_PATH=/usr/local/lib
export LD_LIBRARY_PATH


rm -rf /srv/pillar
rm -rf /srv/salt

ln -s    /var/www/salt/srv/pillar  /srv/pillar

ln -s   /var/www/salt/srv/salt  /srv/salt

sudo killall -9 uwsgi
sudo uwsgi /var/www/salt/salt.ini

sudo nginx -s stop
sudo nginx

sudo rabbitmq-server -detached

nohup python2.7  /var/www/salt/manage.py celeryd -l info 1>/dev/null 2>&1 &

nohup python2.7  /var/www/salt/manage.py celerybeat -l info 1>/dev/null 2>&1 &



