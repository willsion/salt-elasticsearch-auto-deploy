#coding=utf-8
from elasticsearch.models import *
import sys,traceback
from elasticsearch import logger
from django.db import connection
import salt.utils

class pillar_logstash(object):


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

        result = {"result":"ok"}
        return result

    def _add_cluster(self,cluster_file,template,name):

        _name = 'ls-version: "1.3.2"'
        with salt.utils.fopen(cluster_file, 'w') as fp_:
            print >> fp_,_name

        result = {"result":"ok"}
        return result


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