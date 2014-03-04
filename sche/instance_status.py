#coding=utf-8
import os
import sys
import time
import salt.client
files_path = os.path.dirname(
                        os.path.abspath(os.path.dirname(__file__))
                    ) + "/"
sys.path.insert(0,files_path)

from django.db import connection
from elasticsearch import logger
from elasticsearch.models import *

import urllib2,json,datetime,re

'''
os.environ["DJANGO_SETTINGS_MODULE"] = "sysconf.settings"
from apscheduler.scheduler import Scheduler
sched = Scheduler()
sched.daemonic = False
sched.start()
'''

import traceback
from celery.task import task as _task


class status:

    __fetch_sql = '''
    select
        services_template.name,
        machine.target,
        instance_machine.id,
        machine.IP
    from services_template
    INNER JOIN services
    ON services.belong_template = services_template.id
    RIGHT JOIN role
    ON services_template.id = role.service
    INNER JOIN instance_machine
    ON instance_machine.role_id = role.id and services.id = instance_machine.ser_id
    INNER JOIN machine
    ON machine.id = instance_machine.machine_id
    RIGHT JOIN cluster
    ON cluster.id = machine.cluster
    LEFT JOIN role_conf_item
    ON role.id = role_conf_item.role_id
    order by services_template.name;
    '''

    def logstash(self,target):

        _target_role_list = {}

        local  = salt.client.LocalClient()

        for _target,_result in target.items():

            _role = _result["role_configure"]
            #先简单搞，一个target一个target找结果
            if not _target in _target_role_list:
                _target_role_list[_target] = set()

            map_conf_id = {}
            conf_list = set()
            for item in _role:
                map_conf_id[item[1]] = item[0]
                conf_list.add(item[1])

            try:                       
                result = local.cmd(_target, "logstash.status",list(conf_list),timeout=40)

                _result = result[_target]["instance_running"]

                for _item in _result:
                    _key = _item["conf"]
                    if _key in map_conf_id:
                        _id = map_conf_id[_key]

                    ele = instance_machine.objects.get(id=int(_id))
                    ele.last_check = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                    ele.save()
            except:
                continue                   


    def elasticsearch(self,target):
        os.environ["http_proxy"] = ""
        for _target,_result in target.items():
            try:
                ip = _result["ip"]
                _id = list(set(_result["role_configure"]))               
                ret = 0
                result = urllib2.urlopen('http://' + ip + ':9200/', timeout=10).read()
                result = json.loads(result)

                if result["ok"] == True and result["status"] == 200:
                    ret = 1
            except:
                #traceback.print_exc()
                continue

            try:
                ele = instance_machine.objects.filter(id__in=_id)
            except:
                traceback.print_exc()
                continue

            if ret == 1:
                for item in ele:
                    item.last_check = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
                    item.save()

            


    def _status(self):
        try:
            cursor = connection.cursor()
            cursor.execute(self.__fetch_sql)
            raw = cursor.fetchall()

            __template_target = {}

            __target_id = {}

            for item in raw:
                if item[3] == "" or item[3] == None:
                    continue

                try:
                    if item[0] not in __template_target:
                        __template_target[item[0]] = {}

                    if item[1] not in __template_target[item[0]]:
                       __template_target[item[0]][item[1]] = {"role_configure":[],"ip":item[3]} 

                    __template_target[item[0]][item[1]]["role_configure"].append(item[2])

                except:
                    traceback.print_exc()
        	

            for item,target in __template_target.items():
                item = item.lower()
                if not item == "elasticsearch":
                    continue
                fun = getattr(self,item)
                try:
                    fun(target)
                except:
                    continue
        except:
            #traceback.print_exc()
            logger.error("_status " + traceback.format_exc())


@_task
def test():
    st = status()
    st._status()



@_task
def indices_crontab(file):
    #mark
    os.system("sh " + file)


'''
@_task
def check_indice():
    try:
        st = services_template.objects.get(name="elasticsearch")

        
    except:
'''


@_task
def upload_to_git():
    con = os.chdir(r"/home/op1/salt")
    dd = os.popen("git status").read()
    modify =  re.findall(r"modified:[ ]+([^\n]+)",dd)
    for item in modify:
        os.system("git add " + item)
        #print "git add " + item

    delete = re.findall(r"deleted:[ ]+([^\n]+)",dd)
    for item in delete:
        os.system("git rm " + item)
        #print "git rm " + item

    item = re.findall(r"(?<=# Untracked files:[\n])([\s\S]+)(?=[\n]no changes added to commit)",dd)
    if len(item):
        item = item[0].split("\n#")
        for ele_item in item:
            if '"' in ele_item or ele_item.strip() == "":
                continue
            os.system("git add " + ele_item)
            #print "git add " + ele_item
           
    os.system("git commit -m 'auto upload'")
    os.system("git push")
