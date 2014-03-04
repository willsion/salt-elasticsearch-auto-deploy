#coding=utf-8
from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import get_template
from django.template import Context
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from elasticsearch.models import *
from django.db import connection
from elasticsearch import logger
import json,traceback,os,re,pexpect,traceback,copy
from elasticsearch.salt_api import __fetch_machine_info
from _pillar.pillar import *
from _pillar.pillar_elasticsearch import *
from _pillar.pillar_logstash import *


def modify(request):
    ser_id = request.POST.get("ser_id",None)
    role_list = request.POST.get("role_list","").split("+")

    context = {"status":"ok","result":""}

    try:
        if ser_id == None or not ser_id.isdigit():
            raise NameError,"ser invalid"

        #先删除所有ser_id关联的记录
        instance_machine.objects.filter(ser_id=ser_id).delete()

        #往instance_machine中存ser_id  role_id  machine_id的映射关系,其中ser_id和machine_id是必须的
        for item in role_list:
            id_list = item.split("_")
            role_id = id_list[0] if len(id_list) > 0 else None
            machine_id_list = id_list[1].split("&") if len(id_list) > 1 else []

            for machine_id_item in machine_id_list:
                if not machine_id_item.isdigit():
                    continue

                try:
                    ser_item = services.objects.get(id=ser_id)
                except:
                    continue

                im = instance_machine()
                im.ser_id = int(ser_id)
                im.role_id = role_id
                im.machine_id = machine_id_item
                im.save()

                '''
                还要更新cluster信息，因为cluster的这个变量es-zenPingUnicastHosts
                在有新机器加入时，需要修改,role_machine关联变化时es-zenPingUnicastHosts也要修改，
                还未写修改变量的接口,
                但是 可以 直接 重写cluster
                '''
                template_name = ser_item.belong_template.name
                if template_name.lower() == "elasticsearch":
                    exec("pt = pillar_" +  template_name + "()")
                    pi = pillar(pt)
                    pi.add_cluster(template_name,ser_item.name)


        #更新所有target的pillar信息
        pi = pillar()
        pi._refresh()


    except Exception,e:
        context["status"] = "fail"
        context["result"] = e
        logger.error("modify " + traceback.format_exc())
        traceback.print_exc()

    return HttpResponse(json.dumps(context))

def instance(request):
    
    service_id = request.GET.get("service_id",None)

    cluster_id = request.GET.get("cluster_id",None)

    context = {}

    try:
        cl = cluster.objects.get(id=cluster_id)
        context["cluster"] = cl 
    except:
        context["cluster"] = None

    try:
        ser = services.objects.get(id=service_id)
        tem = ser.belong_template
    except:
        ser = {"name":u"找不到该集群"}
        context["services"] = ser
        return render_to_response('instance.html', context,RequestContext(request))

    context["services"] = ser

    #查找所有该cluster下的机器
    try:
        machine_list = machine.objects.filter(cluster=int(cluster_id))
    except:
        ser = {"name":u"找不到该集群"}
        context["services"] = ser
        return render_to_response('instance.html', context,RequestContext(request))        


    _machine = {}


    for item in machine_list:
        _machine[item.id] = {"IP":item.IP, "tag":0,"id":int(item.id)}

    role_machine = []

    try:
        role_list = role.objects.filter(service=tem)
        for item in role_list:
            machine_temp_list = []
            _temp_id = {}
            _machine_list = instance_machine.objects.filter(role_id=item.id,ser_id=int(service_id)).values("machine_id")
            for _machine_info in _machine_list:
                _temp_id[_machine_info["machine_id"]] = 0

            for id,value in _machine.items():
                if id in _temp_id:
                    temp_value = copy.deepcopy(value)
                    temp_value["tag"] = 1
                else:
                    temp_value = value

                machine_temp_list.append(temp_value)

            role_machine.append({"name":item.name,"id":item.id, "machine":machine_temp_list})

    except:
        logger.error("hosts_operations " + traceback.format_exc())
        traceback.print_exc()

    context["role_machine"] = role_machine
    context["cluster_id"] = cluster_id

    print context

    return render_to_response('instance.html', context,RequestContext(request))
                 

