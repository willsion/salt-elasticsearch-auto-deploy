#coding=utf-8
import os,os.path
import sys,traceback
import time
import salt.utils

files_path = "/home/op1/salt"
sys.path.insert(0,files_path)
os.environ["DJANGO_SETTINGS_MODULE"] = "sysconf.settings"
from _pillar.pillar import pillar
from _pillar.pillar_logstash import pillar_logstash
from _pillar.pillar_elasticsearch import pillar_elasticsearch


def pillar_operation(*args,**kwarg):

    result = {"status":"ok"}
    '''
    function_name = kwarg["function_name"]
    template_type = kwarg["template_type"] if "template_type" in kwarg else ""
    '''

    function_name = args[-1]
    template_type = args[-2]

    try:
        if template_type == "no_template":
            pi = pillar() 
        else:
            exec("pt = pillar_" +  template_type + "()")
            pi = pillar(pt)
    except:
        pi = pillar()

    try:
        fun = getattr(pi,function_name)
        try:
            if function_name == "update_cluster_version":
                result = fun(args[0],args[1],args[2])
            else:
                result = fun(args[0],args[1])
        except:
            result = {"status":"fail","result":str(traceback.format_exc())}
    except:
        result = {"status":"fail","result":"can not find the function"}

    return result