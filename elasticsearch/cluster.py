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
import json,traceback,os,re,pexpect,traceback
from elasticsearch.salt_api import __fetch_machine_info
from elasticsearch import logger
from _pillar.pillar import *
from _pillar.pillar_elasticsearch import *
from _pillar.pillar_logstash import *


def redirect_display(request):
    return render_to_response('redirect_display.html') 


def fetch_machine():
    '''
    step 1: 检查Unaccepted Keys,展现给用户
    step 2: 检查Accepted Keys 和数据库存放的机器 是否一致，Accepted Keys中有 且 数据库中没有的机器
    step 3: 检查数据库中cluster字段是个空的机器
    '''
    context = {"Unaccepted":None,"accepted":None,"machine":None}

    try:
        #salt-key命令
        line = os.popen("salt-key -L").read()

        #查找所有Unaccepted Keys
        mac = re.findall(r"(?<=Unaccepted Keys:)([\s\S]*?)(?=Rejected Keys:)",line)
        if len(mac):
            machine_list = mac[0].split("\n")
            context["Unaccepted"] = machine_list

        #查找所有Accepted Keys, 并与数据库中数据做对比
        mac = re.findall(r"(?<=Accepted Keys:)([\s\S]*?)(?=Unaccepted Keys:)",line)
        if len(mac):
            accept_ma_list = mac[0].split("\n")


        accept_ma_info = __fetch_machine_info(accept_ma_list)

        #需要一个IP对target的映射
        _ip_target = {}
        for _target,_ip in accept_ma_info.items():
            if "IP" in _ip and not _ip["IP"] == "":
                _ip_target[_ip["IP"]] = _target

        accept_ma_ip   = map(lambda x: x["IP"] if "IP" in x else "",accept_ma_info.values())
        accept_ma_ip = set(accept_ma_ip)


        #查看salt-key所有机器是否在数据库中
        exist_ma = machine.objects.filter(IP__in=accept_ma_ip).values("IP")
        exist_ma = map(lambda x: x["IP"] if "IP" in x else "",exist_ma)
        exist_ma = set(exist_ma)

        #查看哪些机器在salt-key中出现，但是么有在数据库中出现的
        extra = accept_ma_ip - exist_ma

        extra = list(extra)
        #IP和target的对应关系也传过去
        _extra = []
        for item in extra:
            if item in _ip_target:
                _extra.append([item,_ip_target[item]])

        context["accepted"] = _extra

        #查看哪些机器出现在数据库中，但是不属于任何集群
        all_machine = machine.objects.filter(cluster=None)

        context["machine"] = all_machine

    except:
        logger.error("ser_command " + traceback.format_exc())

    return context

def add_cluster(request):

    context = fetch_machine()
    return render_to_response('add_cluster.html',context,RequestContext(request))   


def machine_list(request):
    id = request.GET.get("id",0)
    context = fetch_machine()
    try:
        context["cluster"] = cluster.objects.get(id=id)
        context["cluster_machine"] = machine.objects.filter(cluster=int(id))
    except:
        context["cluster"] = {"name":"无法找到对应集群"}
        traceback.print_exc()

    return render_to_response('cluster_machine.html',context,RequestContext(request))

def add_cluster_commit(request):
    context = _add_cluster_commit(request,True)
    return HttpResponse(json.dumps(context)) 

def _add_cluster_commit(request,flag):
    new_name       =  request.POST.get("new_name",None)
    unaccept_host  =  request.POST.get("unaccept_host",None)
    ready_to_add_host =  request.POST.get("ready_to_add_host",None)
    accept_host    =  request.POST.get("accept_host",None)


    unaccept_host     = unaccept_host.split("&&")
    ready_to_add_host = ready_to_add_host.split("&&")
    accept_host       = accept_host.split("&&")

    result_status = "ok"

    try:
        if new_name == None and flag:
            raise NameError,"cluster name is null"

        add_unaccept_host_result = []

        unaccept_host_promot_ok = []

        accept_host_result = []
        ready_add_host_result = []

        if flag:
            #存cluster
            cl = cluster()
            cl.name = new_name
            cl.save()
        else:
            cl = cluster.objects.get(id=request.POST.get("id"))

        #先处理Unaccept的机器
        if not unaccept_host == None:
            import pexpect
            #先将要promot的机器 promot进来
            for item in unaccept_host:
                if item == "":
                    continue
                result = "fail"
                child=pexpect.spawn("sudo salt-key -a " + item)
                try:
                    i = child.expect(['The following keys are going to be accepted[\s\S]*'])
                    if i == 0:
                        child.sendline("Y")
                        unaccept_host_promot_ok.append(item)
                        result = "ok" 
                except:
                    traceback.print_exc()           
                finally:
                    add_unaccept_host_result.append([item,result])

            #然后录入数据库中
            ma_info = __fetch_machine_info(unaccept_host_promot_ok)
            for key,item in ma_info.items():
                if "IP" in item and not item["IP"] == "":
                    ma = machine()
                    ma.IP = item["IP"]
                    ma.hostname = item["host"] if "host" in item else ""
                    ma.status = 1
                    ma.cluster = cl.id
                    ma.target = key
                    ma.save()


        #然后处理accept中有，但是数据库中没有的机器
        for item in accept_host:
            try:
                if item == "":
                    continue
                item,target = item.split("_")
                new_machine = machine()
                new_machine.IP = item
                new_machine.cluster = cl.id
                new_machine.target = target
                new_machine.save()
                accept_host_result.append({"host":item,"result":"ok"})
            except:
                logger.error(traceback.format_exc())
                accept_host_result.append({"host":item,"result":"fail"})


        #然后处理ready_to_add_host的机器
        for item in ready_to_add_host:
            try:
                if item == "":
                    continue
                exist_machine = machine.objects.get(IP=item)
                exist_machine.cluster = cl.id
                exist_machine.save()
                ready_add_host_result.append({"host":item,"result":"ok"})
            except:
                logger.error(traceback.format_exc())
                ready_add_host_result.append({"host":item,"result":"fail"})


    except:
        logger.error(traceback.format_exc())
        result_status = "fail"
        #这里要加 log的逻辑

    try:
        context = {"status":result_status,
                    "add_unaccept_host_result":add_unaccept_host_result,
                    "accept_host_result":accept_host_result,
                    "ready_add_host_result":ready_add_host_result}
    except:
        logger.error("ser_command " + traceback.format_exc())

    return context
     



def machine_list_commit(request):

    try:
        delete_machine       =  request.POST.get("delete_machine",None)
        unaccept_host  =  request.POST.get("unaccept_host",None)
        ready_to_add_host =  request.POST.get("ready_to_add_host",None)
        accept_host    =  request.POST.get("accept_host",None)
        context = {"status":"ok","data":""}



        context = _add_cluster_commit(request,False)

        id=request.POST.get("id")
        cl = cluster.objects.get(id=id)
        delete_machine = delete_machine.split("&")
        delete_machine = machine.objects.filter(id__in=delete_machine)
        for item in delete_machine:
            print "====item===id",item.id
            item.cluster = None
            item.save()
            instance_machine.objects.filter(machine_id=int(item.id)).delete()

    except:
        traceback.print_exc()
        context = {"status":"ok","data":""}

    return HttpResponse(json.dumps(context))      

def cluster_com(request):

    context = {"status":"ok","data":""}
    com =  request.POST.get("com",None)
    id  =  request.POST.get("id",None)
    new_name =  request.POST.get("new_name",None)

    try:
        if com == "rename":
            try:
                cl = cluster.objects.get(id=int(id))
            except:
                 raise NameError,"cluster name is invalid"

            cl.name = new_name.strip()
            cl.save()
        else:
            #依次删除service,instance_machine,role,service
            __fetch_sql = '''
                select instance_machine.id,
                    instance_machine.ser_id,
                    instance_machine.machine_id
                from services
                INNER JOIN instance_machine
                ON services.id = instance_machine.ser_id
                INNER JOIN machine
                ON machine.id = instance_machine.machine_id
                where machine.cluster = {0};
            '''.format(id)

            cursor = connection.cursor()
            cursor.execute(__fetch_sql)
            raw = cursor.fetchall()

            in_ma = []
            _ser  = []

            for item in raw:
                in_ma.append(item[0])
                _ser.append(item[1])

            services.objects.filter(id__in=list(set(_ser))).delete()

            for item in machine.objects.filter(cluster=int(id)):
                item.cluster = None
                item.save()
            instance_machine.objects.filter(id__in=list(set(in_ma))).delete()
            cluster.objects.filter(id=int(id)).delete()


    except Exception,e:
        logger.error("ser_command " + traceback.format_exc())
        context = {"status":"fail","data":str(e)}


    return HttpResponse(json.dumps(context)) 




def add_ser_display(request):

    cluster_id = request.GET.get("cluster_id",None)

    st = services_template.objects.all()

    try:
        cl = cluster.objects.get(id=cluster_id)
        ma = machine.objects.filter(cluster=cl.id)
    except:
        return render_to_response('add_instace_step_1.html', context,RequestContext(request))

    ser_role = []
    #根据模板查找所有该模板下的所有 role
    for item in st:
        __role = role.objects.filter(service=item)
        ser_role_mapping = {"ser_template":item,"role":__role}
        ser_role.append(ser_role_mapping)

    context = {"st":st,"ma":ma,"ser_template_role":ser_role,"cluster_id":cluster_id}

    return render_to_response('add_instace_step_1.html', context,RequestContext(request))


def add_ser_commit(request):

    context = {"status":"ok","data":""}
    commit_result = request.POST.get("result",None)
    new_service_name = request.POST.get("new_service_name",None)
    cluster_id = request.POST.get("cluster_id",None)
    cluster_template_id = request.POST.get("cluster_template_id",None)

    result = {"ok":[],"fail":[]}


    try:
        try:
            cl = services_template.objects.get(id=cluster_template_id)
        except:
            raise IndexError,"cl can not be founded"

        new_ser = services()
        new_ser.name = new_service_name
        new_ser.belong_template = cl
        new_ser.status = 1
        new_ser.save()        

        for id_role in commit_result.split("="):
            try:
                id = re.findall(r"^([\d]+)_",id_role)[0]
                role_array = re.findall(r"_(.*)",id_role)[0]
            except:
                raise IndexError,"id is invalid"

            if not id.isdigit():
                continue

            try:
                ma_name = machine.objects.get(id=int(id)).hostname
            except:
                raise NameError,"machine id " + str(id) + "is invalid" 



            for item in role_array.split("&"):

                if not item.isdigit():
                    continue
                try:
                    role_name = role.objects.get(id=int(item)).name
                except:
                    raise NameError,"role id " + str(item) + "is invalid"

                im = instance_machine()
                im.machine_id = id.strip()
                im.role_id    = item.strip()
                im.status     = 0
                im.ser_id     = new_ser.id
                try:
                    im.save()
                    result["ok"].append([ma_name,role_name])
                except:
                    result["fail"].append([ma_name,role_name])

        #需要在/srv/pillar/{{template}}//cluster目录下 生成cluster的信息，包含es，logstash，redis
        template_name = cl.name
        exec("pt = pillar_" +  template_name + "()")
        pi = pillar(pt)
        pi.add_cluster(template_name,new_service_name)

        context["data"] = result

    except Exception,e:
        logger.error("ser_command " + traceback.format_exc())
        context = {"status":"fail","data":str(e)}

    #最后刷新机器上的/srv/pillar/目录的内容
    pi = pillar()
    pi._refresh()

    return HttpResponse(json.dumps(context))


