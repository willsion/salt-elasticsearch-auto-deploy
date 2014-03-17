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
import json,traceback,os,re,pexpect,traceback,copy,datetime,time
from elasticsearch.salt_api import __fetch_machine_info
from _pillar.pillar_op import *

import salt.client,uuid
from celery.decorators import task


files_path = os.path.join(
    os.path.join(
        os.path.dirname(
            os.path.abspath(os.path.dirname(__file__))
        ),
        "static"
    ),
    "img"
)
def update_package(service_tmp,version):
    if service_tmp == 'elasticsearch':
        return elasticsearch_package(version)
def elasticsearch_package(version):
    return u'/srv/salt/source/es/package/elasticsearch-'+version+'.zip'
def download_package(o,url):
    cmd=r"curl -o "+o+" "+url
    os.system(cmd)

@task(ignore_result=True)
def celery_update(machine_ids,machine_list,job_id):

    ret = ""
    ip = ""
    with salt.utils.fopen(files_path + "/" + job_id + "_start", 'w') as fp_:
        print >> fp_,"start"
    _machines = machine.objects.filter(id__in=machine_list)
    _target = []
    for _mc in _machines:
        _target.append(_mc.target)
        ip = _mc.IP
    # 3.关闭 正在运行的 服务
    #print u"machine_operations",machine_ids
    r1 = os.popen("curl -XPUT "+ip+":9200/_cluster/settings -d '{\"transient\":{\"cluster.routing.allocation.disable_allocation\": true}}'").read()

    r2 = machine_operations(machine_ids, "stop")

    # 4.通过 highstate 更新 升级文件

    #r3 = 'r3'
    r3 = highstate_commit(_target,job_id)

    # 5.重新启动 服务
    r4 = machine_operations(machine_ids, "start")
    time.sleep(20)

    r5 = os.popen("curl -XPUT "+ip+":9200/_cluster/settings -d '{\"transient\":{\"cluster.routing.allocation.disable_allocation\": false}}'").read()

    ret = r1+"\n"+r2+"\n"+r3+"\n"+r4+"\n"+r5
    with salt.utils.fopen(files_path + "/" + job_id , 'w') as fp_:
        print >> fp_,ret
    with salt.utils.fopen(files_path + "/" + job_id + "_flag", 'w') as fp_:
        print >> fp_,"finish"

def highstate_commit(idsarry,job_id):
    try:
        web_request(','.join(idsarry),"saltutil.refresh_pillar",[],None,None)

        cmd = 'salt -L "' + ','.join(idsarry) + '" state.highstate '
        print "=========cmd=========",cmd
        res = cmd
        time.sleep(20)
        result = web_request(','.join(idsarry),"state.highstate",[],None,None)
        res = res + "\n" + str(result)
    except:
        logger.error("highstate_commit " + traceback.format_exc())
    return res

def execute(request):
    print(files_path)
    #package_url = request.POST.get("package_url","https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.0.0.zip")
    new_version = request.POST.get("service_version","")
    machine_ids = request.POST.get("machine_ids","")
    service_tmp = request.POST.get("service_tmp","")
    tem_type    = request.POST.get("tem_type","")
    service_id = request.POST.get("service_id",None)

    context = {"status":"ok","result":""}
    if (tem_type != "elasticsearch"):
        context["status"] = "fail"
        context["result"] = u"只能升级 elasticsearch"
        return HttpResponse(json.dumps(context))
    if(machine_ids != ""):
        machine_list = machine_ids.split("_")
    else:
        context["status"] = "fail"
        context["result"] = "没有选择机器"
        return HttpResponse(json.dumps(context))
    #print machine_list

    try:
        ser = services.objects.get(id=service_id)
        tem = ser.belong_template
    except:
        ser = {"name":u"找不到该Services"}
        context["services"] = ""
        context["result"] = "找不到该Services"
        return HttpResponse(json.dumps(context))
    service_name = ser.name
    print("service_name:  " +service_name)
    new_update_package_path = update_package(tem_type,new_version)


    old_version = read_elasticsearch_version_pillar(service_tmp,service_name)

    #if(old_version != new_version):
    if(True):
        try:

            # 1. 判断所需的 安装包 是否存在
            if(not os.path.exists(new_update_package_path)):
                #download_package(new_update_package_path,package_url)
                if(not os.path.exists(new_update_package_path)):
                    # "os.path.exists(new_update_package_path)",os.path.exists(new_update_package_path)
                    context["status"] = "fail"
                    context["result"] = u"升级包"+new_update_package_path+u"不存在"
                    return HttpResponse(json.dumps(context))
            # 2.修改本地的 pillar 中的 version 号
            update_elasticsearch_version_pillar(new_version,service_tmp,service_name)
            print read_elasticsearch_version_pillar(service_tmp,service_name)

            # 3.异步执行 关键的升级操作 （关闭所有服务、highstat同步、启动服务）
            job_id = str(uuid.uuid1())
            print job_id
            print machine_list,machine_ids
            celery_update.delay(machine_ids,machine_list,job_id)
            context["job_id"] = job_id

        except NameError,e:
            context["status"] = "fail"
            context["result"] = e.message
            logger.error("update " + traceback.format_exc())
            traceback.print_exc()
    else:
        context["status"] = "fail"
        context["result"] = u"版本已经相同"
    return HttpResponse(json.dumps(context))

def main(request):
    
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
        ser = {"name":u"找不到该Services"}
        context["services"] = ser
        return render_to_response('update.html', context,RequestContext(request))
    context["services"] = ser
    context["services_tmp"] = ser.belong_template.name
    context["tem_type"] = ser.belong_template.type
    machine_id_list = []
    try:
        machine_ids = instance_machine.objects.filter(ser_id=int(service_id)).values("machine_id")
        print machine_ids
        for item in machine_ids:
            print item["machine_id"]
            machine_id_list.append(item["machine_id"])
    except:
        pass

    print "====================================================================="
    print machine_id_list
    #查找所有该cluster下service的机器
    try:
        machine_list = machine.objects.filter(cluster=int(cluster_id),id__in=machine_id_list)
    except:
        ser = {"name":u"找不到该集群"}
        context["services"] = ser
        return render_to_response('update.html', context,RequestContext(request))

    #查找所有该service下的roles
    try:
        role_list = role.objects.filter(service=tem)
    except:
        ser = {"name":u"找不到该service下的roles"}
        context["services"] = ser
        return render_to_response('update.html', context,RequestContext(request))
    print machine_list
    _role= {}
    for item in role_list:
        _role[item.id] = {"name":item.name, "tag":0,"id":int(item.id)}

    machine_role = []

    try:

        for item in machine_list:
            role_temp_list = []
            _temp_id = {}
            _role_list = instance_machine.objects.filter(machine_id=item.id,ser_id=int(service_id)).values("role_id")
            for _role_info in _role_list:
                _temp_id[_role_info["role_id"]] = _role_info["role_id"]

            for id,value in _role.items():
                if id in _temp_id:
                    temp_value = copy.deepcopy(value)
                    temp_value["tag"] = 1
                else:
                    temp_value = value

                role_temp_list.append(temp_value)

            machine_role.append({"IP":item.IP,"id":item.id, "role":role_temp_list,"update_config":{"version":"0.90.11"}})

    except:
        logger.error("hosts_operations " + traceback.format_exc())
        traceback.print_exc()
    context["now_versioin"] = read_elasticsearch_version_pillar(context["services_tmp"],ser.name)
    context["machine_role"] = machine_role
    context["cluster_id"] = cluster_id

    print context

    return render_to_response('update.html', context,RequestContext(request))
                 
def update_elasticsearch_version_pillar(new_version,service_tmp,service_name):
    #elasticsearch_sls=r"/srv/pillar/elasticsearch/template/elasticsearch.sls"
    #elasticsearch_sls_bak=r"/srv/pillar/elasticsearch/template/elasticsearch.sls."+datetime.datetime.now().strftime('%y-%m-%d-%H:%M:%S');
    #open(elasticsearch_sls_bak, "wb").write(open(elasticsearch_sls, "rb").read())
    #f = open (elasticsearch_sls_bak, "r+")
    #fr = open(elasticsearch_sls, 'w')
    #fr.write(re.sub(r'es-version: "\d+\.\d+\.\d+"',r'es-version: "'+new_version+'"', f.read()))
    #f.close()
    #fr.close()

    try:
        result = web_request("master","pillar_module.pillar_operation",[service_tmp,service_name,new_version],"elasticsearch","update_cluster_version")
    except:
        logger.error("modify " + traceback.format_exc())


def read_elasticsearch_version_pillar(service_tmp,service_name):

    #elasticsearch_sls=r"/srv/pillar/elasticsearch/template/elasticsearch.sls"
    #fr = open(elasticsearch_sls, 'r')
    #for line in fr.readlines():
    #    for i in re.findall(r'es-version: "(\d+\.\d+\.\d+)"',line):
    #        return i
    #fr.close()
    try:
        result = web_request("master","pillar_module.pillar_operation",[service_tmp,service_name],"elasticsearch","read_cluster_version")
    except:
        logger.error("modify " + traceback.format_exc())
        result = ""

    return " ".join(result[0].values())








def machine_operations(id,action):
    print id ,action
    context = {}

    ret = ""

    try:
        if id == None:
             raise NameError,"请选择instance"

        _id_list = id.split("_")

        _item = instance_machine.objects.filter(machine_id__in=_id_list)
        print _item
        _operation = {}

        es__operation = set()

        for _ele in _item:
            try:
                _target = machine.objects.get(id=int(_ele.machine_id)).target
            except:
                logger.error("_target fail " + traceback.format_exc())
                context["result"].append([_ele.machine_id,u"instance记录不存在"])
                continue

            try:
                _role = role.objects.get(id=int(_ele.role_id))
                _template = _role.service.type
            except:
                logger.error("_role fail " + traceback.format_exc())
                context["result"].append([_ele.machine_id,u"无法找到对应模板"])
                continue

            if _template == "elasticsearch":
                es__operation.add(_target)

            elif _template not in _operation:
                _operation[_template] = set()

            if not _template == "elasticsearch" and not _target in _operation[_template]:
                _operation[_template].add(_target)


        if not es__operation == set():

            result = web_request(','.join(list(es__operation)),'elasticsearch.' + action,[],None,None)

            ret = ret +  str(result)

        for _tem,_targ in _operation.items():
                result = web_request(','.join(list(_targ)),_tem + '.' + action,[],None,None)
                ret =  ret  + str(result)

        context["result"] = ret
        return ret
    except:
        logger.error("hosts_operations " + traceback.format_exc())
        context = {"status":"failed"}
