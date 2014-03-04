LD_LIBRARY_PATH=/usr/local/lib
export LD_LIBRARY_PATH


sudo killall -9 uwsgi
sudo uwsgi /var/www/salt/salt.ini

sudo nginx -s stop
sudo nginx

sudo rabbitmq-server -detached

nohup python2.7  /var/www/salt/manage.py celeryd -l info 1>/dev/null 2>&1 &

nohup python2.7  /var/www/salt/manage.py celerybeat -l info 1>/dev/null 2>&1 &



