#coding=utf-8
import os,os.path
import sys,traceback
import time
import salt.utils
from _pillar.pillar_logstash import pillar_logstash
from _pillar.pillar_elasticsearch import pillar_elasticsearch
files_path = os.path.dirname(
                        os.path.abspath(os.path.dirname(__file__))
                    ) + "/"
sys.path.append(files_path)

from django.db import connection
from elasticsearch import logger

'''
因为需要将机器的template,cluster,role信息写入pillar，而不是只保存在数据库中

这里暂时想到一种改pillar方式
        1)  top.sls为
            base:
              '*':
                - user
                - app
                - template
                - elasticsearch.elasticsearch
                - elasticsearch.role.masternode
                - elasticsearch.cluster.opsdev
        即所有机器共享 pillar信息；
        2)  在template.sls中定义机器所属的template
            template:
            {% if grains["id"] in ["VMS01903","VMS01902"] %}
              - elasticsearch
            {% endif %}
            {% if grains["id"] in ["VMS01903","VMS01902","192.168.81.208"] %}
              - logstash
            {% endif %}
        3)  在cluster.sls中定义 机器的 cluster信息，定义方式类似 template.sls
        4)  在role.sls中定义    机器的 role template.sls

        需要考虑的问题，1) template，cluster，role可以不可以重名  2)所有机器共享所有pillar

另外一种方式：
在top.sls文件中：
top.sls
  "192.168.81.208":
    - ele.machine_id
    - elasticsearch.template.elasticsearch
    - elasticsearch.role.masternode
    - elasticsearch.cluster.opsdev
采用插件方式拼装(该台机器有哪些template，cluster，role) 192.168.81.208 这台机器所拥有的pillar信息

ele.machine_id.sls文件中：
定义这台机器的 template，cluster，role信息
template:
  - elasticsearch

role:
  - masternode

cluster:
  - test

先 写 第二种 方式
'''
class pillar:

    _root_path     = "/srv/pillar"

    __fetch_sql = '''
        select
        machine.target,
        services_template.name,
        role.name as `role_name`,
        services.name `ser_name`,
        machine.id
        from instance_machine
        INNER JOIN role
        ON instance_machine.role_id = role.id
        LEFT JOIN services
        ON services.id = instance_machine.ser_id
        LEFT JOIN services_template
        ON services_template.id = role.service
        INNER JOIN machine
        ON machine.id = instance_machine.machine_id
        order by machine.target,services_template.name,role.name;
        '''

    _top    = "base:\n  '*':\n    - user\n    - app\n"

    _top_file = "/srv/pillar/top.sls"


    def __init__(self,ele=None):
        if not ele == None:      
            self._ele = ele


    def __mkdir(self,name):
        if not os.path.isdir(name):
            mask = os.umask(002)
            os.mkdir(name)
            os.umask(mask)


    def __rmdir(self,name):
        if os.path.isdir(name):
            from shutil import rmtree
            rmtree(name)

    def __rm_file(self,name):
        if os.path.isfile(name): 
            os.remove(name)


    def __add_ele(self,template,_type,name):

        template_path = os.path.join(self._root_path,template)
        self.__mkdir(template_path)

        ele_path      = os.path.join(template_path,_type)
        self.__mkdir(ele_path)

        os.system("rm -rf " + os.path.join(ele_path,name + ".sls"))

        mask = os.umask(002)
        os.system("touch " + os.path.join(ele_path,name + ".sls"))
        os.umask(mask)
        
        return os.path.join(ele_path,name + ".sls")


    def add_template(self,name):

        cluster_file = self.__add_ele(name,"template",name)

        result = self._ele._add_template(cluster_file,name)

        return result


    def sub_template(self,name):
        if not name == "elasticsearch":
            name = os.path.join(self._root_path,name)
            self.__rmdir(name)


    def add_cluster(self,template,name):

        cluster_file = self.__add_ele(template,"cluster",name)

        result = self._ele._add_cluster(cluster_file,template,name)

        return result

    def update_cluster_version(self,template,name,version):

        cluster_file = self.__add_ele(template,"cluster",name)

        result = self._ele._update_cluster(cluster_file,template,name,version)

        return result
    def read_cluster_version(self,template,name):

        template_path = os.path.join(self._root_path,template)
        #self.__mkdir(template_path)

        ele_path = os.path.join(template_path,"cluster")
        #self.__mkdir(ele_path)
        #os.system("rm -rf " + os.path.join(ele_path,name + ".sls"))
        #mask = os.umask(002)
        #os.system("touch " + os.path.join(ele_path,name + ".sls"))
        #os.umask(mask)
        cluster_file = os.path.join(ele_path,name + ".sls")
        result = self._ele._read_cluster_version(cluster_file,template,name)
        return result

    def rm_cluster(self,template,name):
        template_path = os.path.join(self._root_path,template)
        cluster_path  = os.path.join(template_path,"cluster")
        cluster_file  = os.path.join(cluster_path,name + ".sls")
        self.__rm_file(cluster_file)



    def add_role(self,template,name):

        role_file = self.__add_ele(template,"role",name)

        result = self._ele._add_role(role_file,template,name)

        return result


    def rm_role(self,template,name):
        template_path = os.path.join(self._root_path,template)
        role_path  = os.path.join(template_path,"role")
        role_file  = os.path.join(role_path,name + ".sls")
        self.__rm_file(role_file)



    def __refresh_para(self):

        self.last_target = ""

        self.cotent = [set(),set(),set(),set()]

        self._cotent = ""

        self.module = []

        self.last_id = ""

        #现在只支持一台机器上 部署一份es或是logstash
        self.ser_conf = {}


    def __refresh_template_para(self):

        self.last_template = ""

        self._cluster = set()

        self.role = set()

        self.sentence = []


    def __summary_template(self):

        if self.last_template == None or self.last_template == "":
            return
        #pre操作：
        exec("pt = pillar_" +  self.last_template + "()")
        _conf_list = pt.role_conf( list(self.role) )

        if not _conf_list == []:
            self.ser_conf[self.last_template + "_conf"] =  _conf_list

        #第一步是    - elasticsearch.template.elasticsearch
        _temp = "    - " + self.last_template + ".template." + self.last_template                    
        self.sentence.append(_temp)

        '''
        第二步是    - elasticsearch.cluster.opsdev
        这一步目前考虑 一台机器上 部署多个 es，多个 logstash
        es，logstash部署的 sls文件也需要更改，改为循环pillar["cluster"]
        '''
        _temp = ["    - " + self.last_template + ".cluster." + x for x in self._cluster]
        self.sentence.extend(_temp)

        '''
        第三步是    - elasticsearch.role.masternode
        多个角色
        '''
        _temp = ["    - " + self.last_template + ".role." + x for x in self.role]
        self.sentence.extend(_temp)

        #然后将所有该template的数据写到 该机器的module中
        self.module.append("\n".join(self.sentence))

        self.__refresh_template_para()


    def __summary_IP(self):

        if self.last_template == None or self.last_template == "":
            return
            
        _ele_file = "/srv/pillar/ele/" + self.last_id + ".sls"

        '''
        将这台机器最后一个 template写好
        '''
        self.__summary_template()

        #写 target.sls文件的逻辑
        for index,item in enumerate(["template","role","cluster"]):
            _temp = self.cotent[index]
            if not _temp == set():
                self._cotent = self._cotent + item + ":\n  - " + "\n  - ".join(self.cotent[index]) + "\n"

        #还需要写每个template对应的配置文件
        for key,value in self.ser_conf.items():

            values = [ "\n    ".join([": ".join(map(str,x)) for x in y.items()]) for y in value]

            self._cotent = self._cotent + key + ":\n  - " + "\n  - ".join(values) + "\n"
              
        with salt.utils.fopen(_ele_file, 'w') as fp_:
            print >> fp_,self._cotent

        self.module.append("    - ele." + self.last_id)

        if not self.last_target.strip() == "":
            self._top = self._top + '\n  "' + self.last_target + '":\n' + "\n".join(self.module)

        self.__refresh_para()


    #做全量更新，局部更新逻辑后写
    def _refresh(self):

        self.__mkdir("/srv/pillar/ele")

        cursor = connection.cursor()
        cursor.execute(self.__fetch_sql)
        machine_list =  cursor.fetchall()

        self.__refresh_para()
        self.__refresh_template_para()

        for ele in machine_list:

            if not self.last_target == ele[0] and not self.last_target == "":

                self.__summary_IP()

                self.last_template = ""

            if not self.last_template == ele[1] and not self.last_template == "":
                self.__summary_template()           

            '''
            if ele[1] == "logstash":
                pl = pillar_logstash()
                _conf_list = pl.role_conf([ele[2]])
                self.cotent[3] = self.cotent[3] | set(_conf_list)
            '''

            self.cotent[0].add(ele[1])
            self.cotent[1].add(ele[2])
            self.cotent[2].add(ele[3])

            self._cluster.add(ele[3])
            self.role.add(ele[2])

            self.last_target,self.last_template,self.last_id = ele[0],ele[1],str(ele[4])

        self.__summary_IP()

        with salt.utils.fopen(self._top_file, 'w') as fp_:
            print >> fp_,self._top

