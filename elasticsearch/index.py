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
import json,traceback,os,re,traceback,uuid,re,urllib2,re
from elasticsearch.salt_api import __fetch_machine_info
from elasticsearch import logger
import salt.utils

files_path = os.path.join(
            os.path.join(
                os.path.dirname(
                        os.path.abspath(os.path.dirname(__file__))
                    ), 
                "static"
            ), 
            "img"
        )

def _add_ele(sentence,flag,date,key):

    mapping = {"delete":"-d","close":"-c","disable":"-b"}
    if flag:
        sentence.append(mapping[key] + " " + str(date)) 

def __fetch_all_es_masternode():
    try:
        st = services_template.objects.filter(type="elasticsearch")
        rl = [x.id for x in role.objects.filter(name="masternode")]
        all_ser = services.objects.filter(belong_template__in=st)
        all_masternode = instance_machine.objects.filter(ser_id__in=[x.id for x in all_ser],role_id__in=rl)
        all_master_machine = machine.objects.filter(id__in=[x.machine_id for x in all_masternode])
        return list(set([x.IP for x in all_master_machine]))
    except:
        return []

def __fetch_es_masternode(ser):
    try:
        rl = [x.id for x in role.objects.filter(name="masternode")]
        all_masternode = instance_machine.objects.filter(ser_id=ser.id,role_id__in=rl)
        all_master_machine = machine.objects.filter(id__in=[x.machine_id for x in all_masternode])
        return list(set([x.IP for x in all_master_machine]))
    except:
        return []

def __refresh_file():

    file_path = "/home/op1/curator/es_index_maint.sh"
    file_head = ["#!/bin/bash","export http_proxy="]
    setting = []
    for item in __fetch_all_es_masternode():
        setting.append("curl -XPUT "+ item + ":9200/_cluster/settings -d '{\"transient\":{\"cluster.routing.allocation.disable_allocation\": true}}'")
    need_file = {}

    file_head.extend(setting)

    optimize_file = {}

    ind = indices.objects.all()
    for item in ind:
        sentence = []
        _add_ele(sentence,item.delete_flag,item.delete,"delete")
        _add_ele(sentence,item.close_flag,item.close,"close")
        #_add_ele(sentence,item.optimize_flag,item.optimize,"optimize")
        _add_ele(sentence,item.disable_flag,item.disable,"disable")

        if not sentence == []:
            IP = __fetch_es_masternode(item.ser)
            if IP == []:
                continue
            else:
                IP = IP[0]
            temp = "python2.7  /home/op1/curator/curator.py --host " + IP + " --prefix " + item.name + "  " + " ".join(sentence)  + " -t 7200 -l /home/op1/curator/daily_cleanup.log"
            file_head.append(temp)
            file_head.append("sleep 60s")
        if item.optimize_flag:
            optimize_file[item.name] = [item.optimize,IP]

    #if not optimize_file == {}:
    #   file_head.append(setting)

    for item in __fetch_all_es_masternode():
        file_head.append("curl -XPUT " + item + ":9200/_cluster/settings -d '{\"transient\":{\"cluster.routing.allocation.disable_allocation\": false}}'")
    need_file = {}


    for key,value in optimize_file.items():
        temp = "python2.7  /home/op1/curator/curator.py --host " + str(value[1]) + " --prefix " + key + " -o " + str(value[0])  + " -t 7200 -l /home/op1/curator/daily_cleanup.log"
        file_head.append(temp)

    
    with salt.utils.fopen(file_path, 'w') as fp_:
        print >> fp_,"\n".join(file_head)

    os.system("chmod 777 " + file_path)




def items_commit(request):
    name_list = request.POST.get("name_list","").split("&")
    content = request.POST.get("content","").split("&")

    context = {"result":"","status":"ok"}

    try:
        for index,item in enumerate(content):
            try:
                date_item,flag_item = item.split("+")
                date_item = date_item.split("_")
                flag_item = flag_item.split("_")
                flag_item = [True if x.strip() == "enable" else False for x in flag_item]

                ind = indices.objects.get(name=name_list[index])
                ind.delete  = date_item[0].strip() if date_item[0].isdigit() else 7
                ind.delete_flag = flag_item[0]
                ind.close       = date_item[1].strip() if date_item[1].isdigit() else 5
                ind.close_flag  = flag_item[1]
                ind.optimize    = date_item[2].strip() if date_item[2].isdigit() else 2
                ind.optimize_flag = flag_item[2]
                ind.disable       = date_item[3].strip() if date_item[3].isdigit() else 2
                ind.disable_flag  = flag_item[3]
                ind.save()

            except:
                logger.error("items_commit " + traceback.format_exc())
                continue

        __refresh_file()

    except Exception,e:
        logger.error("items_commit " + traceback.format_exc())
        traceback.print_exc()
        context["status"] = "fail"
        context["result"] = str(e)        

    return HttpResponse(json.dumps(context))        
 


def batch_commit(request):

    id_list = request.POST.get("id_list","").split("&")
    date_list = request.POST.get("date_list","").split("&")
    flag_list = request.POST.get("flag_list","").split("&")

    flag_list = [True if x.strip() == "enable" else False for x in flag_list]

    _date_flag = zip(date_list,flag_list)

    context = {"result":"","status":"ok"}
    try:
        for item in id_list:
            try:
                ind = indices.objects.get(id=item)
            except:
                continue

            ind.delete  = _date_flag[0][0].strip() if _date_flag[0][0].isdigit() else 7
            ind.delete_flag = _date_flag[0][1]
            ind.close       = _date_flag[1][0].strip() if _date_flag[1][0].isdigit() else 5
            ind.close_flag  = _date_flag[1][1]
            ind.optimize    = _date_flag[2][0].strip() if _date_flag[2][0].isdigit() else 2
            ind.optimize_flag = _date_flag[2][1]
            ind.disable       = _date_flag[3][0].strip() if _date_flag[3][0].isdigit() else 2
            ind.disable_flag  = _date_flag[3][1]
            ind.save()

        __refresh_file()

    except:
        logger.error("modify_commit " + traceback.format_exc())
        traceback.print_exc()
        context["status"] = "fail"
        context["result"] = str(e)        

    return HttpResponse(json.dumps(context))
   

def _save(_need_add,ope_flag,ser):
    if ope_flag:
        for item in _need_add:
            try:
                if item.strip == "":
                    continue
                in_item =  indices()
                in_item.name = item
                in_item.ser = ser
                in_item.save()
            except:
                traceback.print_exc()
                continue
    else:
        for item in _need_add:
            try:
                in_item =  indices.objects.filter(name=item,ser=ser)
                in_item.delete()
            except:
                traceback.print_exc()
                continue


def fetch_commit(request):

    _need_add = request.POST.get("_need_add","").split("&_&")
    _need_delete = request.POST.get("_need_delete","").split("&_&")
    _exist_index = request.POST.get("_exist_index","").split("&_&")
    ser_id       = request.POST.get("ser_id",None)

    context = {"result":"","status":"ok"}
    try:
        try:
            ser = services.objects.get(id=ser_id)
        except:
            logger.error("fetch_commit " + traceback.format_exc())
            traceback.print_exc()
            raise IndexError,"无法找到对应的service"

        _save(_need_add,1,ser)
        _save(_need_delete,0,ser)       
        _save(_exist_index,0,ser)

    except:
        logger.error("fetch_commit " + traceback.format_exc())
        traceback.print_exc()
        context["status"] = "fail"
        context["result"] = str(e)        

    return HttpResponse(json.dumps(context))


def fetch_display(request):

    ser_id = request.POST.get("ser_id",None)
    check_way = request.POST.get("check_way",None)
    url = request.POST.get("url","")
    check_parttern = request.POST.get("check_parttern","")
    check_parttern = check_parttern.split(",")

    context = {"result":"","status":"ok"}

    try:
        machine_ip = url.strip() + "/_stats"
        if check_way == "masternode":
            try:
                ser = services.objects.get(id=ser_id)
                role_id = role.objects.get(name="masternode",service=ser.belong_template).id
            except:
                logger.error("fetch " + traceback.format_exc())
                traceback.print_exc()
                raise IndexError,"无法找到角色:masternode"

            try:
                machine_id = instance_machine.objects.filter(role_id=role_id,ser_id=ser_id)[0].machine_id
                machine_ip = machine.objects.get(id=machine_id).IP
                machine_ip = "http://" + machine_ip + ":9200/_stats"
            except:
                logger.error("fetch " + traceback.format_exc())
                traceback.print_exc()
                raise IndexError, "无法找到masternode对应机器"


        os.environ["http_proxy"] = ""
        result = urllib2.urlopen(machine_ip).read()
        result = json.loads(result)["indices"].keys()

        exist_index = set()
        _exist = {}        

        for item in result:
            for _reg_item in check_parttern:
                try:
                    index_name = re.findall(_reg_item,item)[0]
                except:
                    continue
                if index_name == "":
                    continue
                exist_index.add(index_name)
                if index_name not in _exist:
                    _exist[index_name] = []
                _exist[index_name].append(item)



        database_index = set()
        for item in indices.objects.filter(ser=services.objects.get(id=ser_id)):
            database_index.add(item.name)

        _need_add = list(exist_index - database_index)

        _exceed   = list(database_index - exist_index)

        _exist_index = list(exist_index & database_index)

        context["_need_add"] = _need_add
        context["_exceed"]   = _exceed
        context["_exist"]    = _exist
        context["_exist_index"] = _exist_index

    except Exception,e:
        logger.error("fetch " + traceback.format_exc())
        traceback.print_exc()
        context["status"] = "fail"
        context["result"] = str(e)

    return HttpResponse(json.dumps(context))



def main(request):
    cluster_id = request.GET.get("cluster_id",None)
    service_id = request.GET.get("service_id",None)

    context = {}

    try:
        ser = services.objects.get(id=service_id)
        tem = ser.belong_template
    except:
        ser = {"name":u"找不到该集群"}
        context["services"] = ser
        return render_to_response('index.html', context,RequestContext(request))

    context["services"] = ser

    try:
        cl = cluster.objects.get(id=cluster_id)
        context["cluster"] = cl 
    except:
        context["cluster"] = None    

    context["index"] = indices.objects.filter(ser=ser)

    return render_to_response('index.html',context,RequestContext(request))
