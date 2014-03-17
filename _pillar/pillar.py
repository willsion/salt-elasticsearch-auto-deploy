#coding=utf-8
import os,os.path
import sys,traceback
import time
import salt.utils

files_path = "/home/op1/salt"
sys.path.insert(0,files_path)
os.environ["DJANGO_SETTINGS_MODULE"] = "sysconf.settings"
from _pillar.pillar_logstash import pillar_logstash
from _pillar.pillar_elasticsearch import pillar_elasticsearch


from django.db import connection
from elasticsearch import logger
from django.conf import settings
from elasticsearch.models import *
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

    _root_path     = settings.PILLAR_ROOT

    __fetch_sql = '''
        select
        machine.target,
        services_template.name,
        role.name as `role_name`,
        services.name `ser_name`,
        machine.id,
        services_template.type
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

    _top    = "base:\n  '*':\n    - es.user\n    - es.app\n"

    _top_file = "/srv/pillar/top.sls"


    def __init__(self,ele=None):
        if not ele == None:      
            self._ele = ele
        else:
            self._ele = None

        self.pillar_root =  ".".join(self._root_path.split("/")[3:])
        #这里校验pillar的root逻辑是弱的，默认pillar的根是 /srv/pillar/
        #应该从salt的配置项里读取pillar的root目录
    def __mkdir(self,name):

        try:
            if not os.path.isdir(name):
                mask = os.umask(002)
                os.mkdir(name)
                os.umask(mask)
        except:
            logger.error("__mkdir " + traceback.format_exc())

    def __rmdir(self,name):
        try:
            if os.path.isdir(name):
                from shutil import rmtree
                rmtree(name)
        except:
            logger.error("__rmdir " + traceback.format_exc())

    def __rm_file(self,name):
        try:
            if os.path.isfile(name): 
                os.remove(name)
        except:
            logger.error("__rm_file " + traceback.format_exc())

    def __add_ele(self,template,_type,name):

        try:
            name = str(name)
            template_path = os.path.join(self._root_path,template)
            self.__mkdir(template_path)

            ele_path      = os.path.join(template_path,_type)
            self.__mkdir(ele_path)

            os.system("rm -rf " + os.path.join(ele_path,name + ".sls"))

            mask = os.umask(002)
            os.system("touch " + os.path.join(ele_path,name + ".sls"))
            os.umask(mask)
            
            return os.path.join(ele_path,name + ".sls")
        except:
            logger.error("__add_ele " + traceback.format_exc())
            return None


    def add_template(self,name,temp):

        cluster_file = self.__add_ele(name,"template",name)
        result = []
        if not self._ele == None:
            result = self._ele._add_template(cluster_file,name)

        return result


    def sub_template(self,name,temp):
        name = os.path.join(self._root_path,name)
        self.__rmdir(name)


    def add_cluster(self,template,name):

        cluster_file = self.__add_ele(template,"cluster",name)
        result = ""
        if self._ele:
            result = self._ele._add_cluster(cluster_file,template,name)

        return result

    def update_cluster_version(self,template,name,version):

        cluster_file = self.__add_ele(template,"cluster",name)
        result = ""
        if self._ele:
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
        result = ""
        cluster_file = os.path.join(ele_path,name + ".sls")
        if self._ele:
            result = self._ele._read_cluster_version(cluster_file,template,name)
        return result

    def rm_cluster(self,template,name):
        template_path = os.path.join(self._root_path,template)
        cluster_path  = os.path.join(template_path,"cluster")
        cluster_file  = os.path.join(cluster_path,name + ".sls")
        self.__rm_file(cluster_file)


    def _add_role(self,role_file,template,name):
        try:
            st = services_template.objects.get(name=template)
            role_item = role.objects.get(name=name,service=st)
            all_object = role_conf_item.objects.filter(role_id=role_item)
            all_configure = []
            for x in all_object:
                yaml_regular = []
                value_array = x.value.split("\n")
                for index,item in enumerate(value_array):
                    #第一行和 最后一行必须是空2格
                    if index == 0 or index == len(value_array) - 1:
                        item = item.lstrip()
                    yaml_regular.append("  " + item)

                all_configure.append(str(x.configure_item.id) + ": |\n" + "\n".join(yaml_regular) )

        except:
            logger.error("_add_role " + traceback.format_exc())
            return
        #现在采取粗暴的重写方式("w")来修改文件，应该温柔点
        with salt.utils.fopen(role_file, 'w') as fp_:
            print >> fp_,"\n".join(all_configure)


    def add_role(self,template,name):

        role_file = self.__add_ele(template,"role",name)

        if self._ele:
            result = self._ele._add_role(role_file,template,name)
        else:
            result = self._add_role(role_file,template,name)

        return result


    def rm_role(self,template,name):
        template_path = os.path.join(self._root_path,template)
        role_path  = os.path.join(template_path,"role")
        role_file  = os.path.join(role_path,name + ".sls")
        self.__rm_file(role_file)


    def role_conf(self,role_conf,template):
        ret = []
        try:
            st = services_template.objects.get(name=template)
            all_role = role.objects.filter(name__in=role_conf,service=st)

            all_conf_id = role_conf_item.objects.filter(role_id__in=all_role)

            all_conf_id = [x.configure_item.template_configure_id.id for x in all_conf_id]

            result = template_configure.objects.filter(id__in=all_conf_id).values("name","deploy_path")

            ret = []
            for item in result:
                if item["deploy_path"] == None or item["deploy_path"].strip() == "":
                    item.pop("deploy_path")
                ret.append(item)
        except:
            logger.error("role_conf " + traceback.format_exc())
        return ret


    def __refresh_para(self):

        self.last_target = ""

        self.cotent = [set(),set(),set(),set()]

        self.template_type = {}

        self._cotent = ""

        self.module = []

        self.last_id = ""

        #现在只支持一台机器上 部署一份es或是logstash
        self.ser_conf = {}


    def __refresh_template_para(self):

        self.last_template = ""
        #一个template对应一个type
        self.last_type = ""

        self._cluster = set()

        self.role = set()

        self.sentence = []


    def __summary_template(self):

        if self.last_template == None or self.last_template == "":
            return
        #pre操作:
        try:
            exec("pt = pillar_" +  self.last_type + "()")
        except:
            pt = pillar()
        _conf_list = pt.role_conf( list(self.role),self.last_template )

        if not _conf_list == []:
            self.ser_conf[self.last_template + "_conf"] =  _conf_list

        #第一步是    - elasticsearch.template.elasticsearch
        _temp = "    - " + self.pillar_root +  self.last_template + ".template." + self.last_template                    
        self.sentence.append(_temp)

        '''
        第二步是    - elasticsearch.cluster.opsdev
        这一步目前考虑 一台机器上 部署多个 es，多个 logstash
        es，logstash部署的 sls文件也需要更改，改为循环pillar["cluster"]
        '''
        _temp = ["    - " + self.pillar_root  + self.last_template + ".cluster." + x for x in self._cluster]
        self.sentence.extend(_temp)

        '''
        第三步是    - elasticsearch.role.masternode
        多个角色
        '''
        _temp = ["    - " + self.pillar_root  + self.last_template + ".role." + x for x in self.role]
        self.sentence.extend(_temp)

        #然后将所有该template的数据写到 该机器的module中
        self.module.append("\n".join(self.sentence))

        self.__refresh_template_para()



    def __summary_IP(self):

        if self.last_template == None or self.last_template == "":
            return
            
        _ele_file = self._root_path + "/ele/" + self.last_id + ".sls"

        '''
        将这台机器最后一个 template写好
        '''
        self.__summary_template()

        #写 target.sls文件的逻辑
        for index,item in enumerate(["template_type","role","cluster"]):
            _temp = self.cotent[index]
            if not _temp == set():
                if index == 0:
                    #这里不是很好，逻辑不通用了，现在设想的是template的格式是数组
                    #数组的每个元素是dict，template:name,type:name
                    #因为source的目录结构是 source_root/type/template/ 无语的路径
                    #type和template必须是一一对应的

                    all_type = list(set([self.template_type[x] for x in self.cotent[index]]))
                    self._cotent = self._cotent +  "template:\n  - " + "\n  - ".join(all_type) + "\n"

                    value = ["template: " +  x + "\n    type: " + self.template_type[x] for x in self.cotent[index]]
                    value = "\n  - ".join(value)
                    self._cotent = self._cotent + item + ":\n  - " + value + "\n"

                else:
                    self._cotent = self._cotent + item + ":\n  - " + "\n  - ".join(self.cotent[index]) + "\n"

        #还需要写每个template对应的配置文件
        for key,value in self.ser_conf.items():

            values = [ "\n    ".join([": ".join(map(str,x)) for x in y.items()]) for y in value]

            self._cotent = self._cotent + key + ":\n  - " + "\n  - ".join(values) + "\n"
              
        with salt.utils.fopen(_ele_file, 'w') as fp_:
            print >> fp_,self._cotent

        self.module.append("    - " + self.pillar_root + "ele." + self.last_id)

        if not self.last_target.strip() == "":
            self._top = self._top + '\n  "' + self.last_target + '":\n' + "\n".join(self.module)

        self.__refresh_para()


    #做全量更新，局部更新逻辑后写
    def _refresh(self,*args):

        self.__mkdir(self._root_path + "/ele")

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

            self.cotent[0].add(ele[1])
            self.cotent[1].add(ele[2])
            self.cotent[2].add(ele[3])

            self._cluster.add(ele[3])
            self.role.add(ele[2])

            self.last_target,self.last_template,self.last_id,self.last_type = ele[0],ele[1],str(ele[4]),ele[5]

            self.template_type[self.last_template] = self.last_type

        self.__summary_IP()

        with salt.utils.fopen(self._top_file, 'w') as fp_:
            print >> fp_,self._top
