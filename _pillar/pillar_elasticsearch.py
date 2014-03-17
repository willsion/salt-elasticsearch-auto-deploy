#coding=utf-8
from elasticsearch.models import *
import sys,traceback
from elasticsearch import logger
from django.db import connection
from django.conf import settings
import salt.utils,re,os

default_version = "0.90.11"
class pillar_elasticsearch(object):


    def role_conf(self,role_conf,template):

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
        return ret


    def _add_template(self,file,name):

        pillar = settings.PILLAR_ROOT
        os.system("cat " + pillar + "/elasticsearch_template/template/elasticsearch.sls > " + file)
        result = {"result":"ok"}
        return result

    def _add_cluster(self,cluster_file,template,name):


        result = {"result":"fail"}
            
        _name = "clustername: " + name

        try:
            cl = services.objects.get(name=name)
        except:
            logger.error("add_cluster " + traceback.format_exc())
            result["reason"] = "cluster invalid"
            return result

        try:
            # es系统每台机器的 id是 grains["id"]来表示的，grains["id"] 就是target
            ma_list = machine.objects.filter(id__in=[x["machine_id"] for x in instance_machine.objects.filter(ser_id=cl.id).values("machine_id")] ).values("target")

            ma_list = ",".join([x["target"] for x in ma_list])
        except:
            logger.error("add_cluster " + traceback.format_exc())
            result["reason"] = "machine invalid"
            return result           

        cluster_ser = "es-zenPingUnicastHosts: '[" + ma_list + "]'"
        es_version = "es-version: '" + default_version + "'"
        #现在采取粗暴的重写方式("w")来修改文件，应该温柔点,现在只是将 集群的 name和 集群的机器列表当成 cluster的信息.
        #默认所有集群的其他配置一致，这个需要再考虑
        with salt.utils.fopen(cluster_file, 'w') as fp_:
            print >> fp_,_name
            print >> fp_,cluster_ser
            print >> fp_,es_version


        return result
    def _update_cluster(self,cluster_file,template,name,version):
        result = {"result":"fail"}

        _name = "clustername: " + name

        try:
            cl = services.objects.get(name=name)
        except:
            logger.error("add_cluster " + traceback.format_exc())
            result["reason"] = "cluster invalid"
            return result

        try:
            # es系统每台机器的 id是 grains["id"]来表示的，grains["id"] 就是target
            ma_list = machine.objects.filter(id__in=[x["machine_id"] for x in instance_machine.objects.filter(ser_id=cl.id).values("machine_id")] ).values("target")

            ma_list = ",".join([x["target"] for x in ma_list])
        except:
            logger.error("add_cluster " + traceback.format_exc())
            result["reason"] = "machine invalid"
            return result

        cluster_ser = "es-zenPingUnicastHosts: '[" + ma_list + "]'"
        es_version = "es-version: '" + version + "'"
        #现在采取粗暴的重写方式("w")来修改文件，应该温柔点,现在只是将 集群的 name和 集群的机器列表当成 cluster的信息.
        #默认所有集群的其他配置一致，这个需要再考虑
        with salt.utils.fopen(cluster_file, 'w') as fp_:
            print >> fp_,_name
            print >> fp_,cluster_ser
            print >> fp_,es_version

    def _read_cluster_version(self, cluster_file, template, name):
        #result = {"result": "fail"}
        #_name = "clustername: " + name
        print("_read_cluster_version:  " + cluster_file)
        fr = open(cluster_file, 'r')
        for line in fr.readlines():
            for i in re.findall(r"es-version: '(\d+\.\d+\.\d+)'", line):
                fr.close()
                return i

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
            import traceback
            traceback.print_exc()
            return
        #现在采取粗暴的重写方式("w")来修改文件，应该温柔点
        with salt.utils.fopen(role_file, 'w') as fp_:
            print >> fp_,"\n".join(all_configure)

