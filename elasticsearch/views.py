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
from django.contrib.auth.decorators import login_required, permission_required
import json,traceback,time,re
import os,salt.client,time,datetime
from time import mktime

from _pillar.pillar_op import *


import salt.utils,uuid 
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


def redirect_cluster(request):
    id = request.GET.get("id",None)
    context = {"id":id}
    return render_to_response('redirect_service.html',context)    

def fetch_job(request):

    context = {"status":"ok"}

    try:
        job_id = request.GET.get("job_id",None)
        job_size = request.GET.get("job_size",0)
        job_size = int(job_size)
        #print("fetch_job:  " + files_path)
        if os.path.isfile(files_path + "/" + job_id + "_flag"):
            context["end_flag"] = 1
        else:
            context["end_flag"] = 0

        line = ""
        context["job_size"] = 0       
        with salt.utils.fopen(files_path + "/" + job_id, 'r') as fp_:
            fp_.seek(job_size, 0)
            line = fp_.read()
        context["job_size"] = job_size + len(line)
        context["result"]   = line.replace("\n","</br>").replace(" ","&nbsp;")

        if context["end_flag"] == 1:
            os.system("rm -rf " + files_path + "/" + job_id)
            os.system("rm -rf " + files_path + "/" + job_id + "_flag")
    except:
        context["context"] = "fail"
        #traceback.print_exc()
  
    return HttpResponse(json.dumps(context))

@task(ignore_result=True)
def celery_highstate(list_data,job_id):

    try:
        web_request(','.join(list_data),"saltutil.refresh_pillar",[],None,None)

        result = web_request(','.join(list_data),"state.highstate",[],None,None)

        with salt.utils.fopen(files_path + "/" + job_id, 'w') as fp_:
            print >> fp_,str(result)

    except:
        traceback.print_exc()

    with salt.utils.fopen(files_path + "/" + job_id + "_flag", 'w') as fp_:
        print >> fp_,"finish"



def highstate_commit(request):
    idarray = request.POST.get("id",None)
    context = {"status":"ok"}
    try:
        web_request("master","pillar_module.pillar_operation",[],None,"_refresh")

        idarray = idarray.split("&")
        id = str(uuid.uuid1())
        celery_highstate.delay(idarray,id)

        context["job_id"] = id
    except:
        logger.error("highstate_commit " + traceback.format_exc())
        context = {"status":"failed"}

    return HttpResponse(json.dumps(context))        

def highstate(request):

    try:
        all_machine = machine.objects.all()
        context = {}
        machine_list = []

        for item in all_machine:
            machine_list.append([item.id,item.target])

        context["machine"] = machine_list
        context["status"] = "ok"
    except:
        logger.error("highstate " + traceback.format_exc())
        context = {"status":"failed"}

    return HttpResponse(json.dumps(context))


def home(request):
    context = {}
    context["clusters"] = []

    id = request.GET.get("id",None)
    First = True if id == None else False

    try:
        all_ser = services.objects.all()

        for item in all_ser:
            print item.id,item.name
            action = False
            if id == str(item.id):
                action = True
            elif First:
                action = True
                First = False
            context["clusters"].append({"name":item.name,"id":item.id,"action":action})
    except:
        traceback.print_exc()
        context = {"status":"failed"}

    return render_to_response('dashboard.html',context)

def indexdata(request):
    id = request.GET.get("id")

    current_time = time.strftime('%Y%m%d%H%M%S',time.localtime(time.time()))

    result = []
    try:
        ser_name = services.objects.get(id=id).name
        tmp_dict = {}
        count = 0
        ser_info = zabbix_conf.objects.filter(item_id=ser_name)
        indic = { "name":'cluster',"item": [] }
        #indic = { "name":'cluster',"item":{'name':'cluster','ele':[]}}
        for item in ser_info:
            item.ip = "cluster" if item.ip == None else item.ip
            if not item.ip in tmp_dict:
                tmp_dict[item.ip] = count
                indic["item"].append({"name":item.ip,"ele":[]})
                count = count + 1

            url = re.sub("&stime=[\d]+","&stime=" + current_time,item.url)
            indic["item"][tmp_dict[item.ip]]["ele"].append([item.graphid,url])
                         
        result.append(indic)


        tmp_dict = {}
        count = 0
        ser_info  = zabbix_conf.objects.filter(item=ser_name,description="indices")
        indic = { "name":'indices',"item": [] }
        for item in ser_info:
            item.ip = "cluster" if item.ip == None else item.ip
            if not item.ip in tmp_dict:
                tmp_dict[item.ip] = count
                indic["item"].append({"name":item.ip,"ele":[]})
                count = count + 1

            url = re.sub("&stime=[\d]+","&stime=" + current_time,item.url)
            indic["item"][tmp_dict[item.ip]]["ele"].append([item.graphid,url])
                         
        result.append(indic)

        tmp_dict = {}
        count = 0
        nodes  = zabbix_conf.objects.filter(item=ser_name,description="machine")
        indic = { "name":'nodes',"item": [] }
        for item in nodes:
            item.ip = "cluster" if item.ip == None else item.ip
            if not item.ip in tmp_dict:
                tmp_dict[item.ip] = count
                indic["item"].append({"name":item.ip,"ele":[]})
                count = count + 1
            url = re.sub("&stime=[\d]+","&stime=" + current_time,item.url)
            indic["item"][tmp_dict[item.ip]]["ele"].append([item.graphid,url])
                         
        result.append(indic)

    except:
        logger.error("hosts_operations " + traceback.format_exc())
        result = {}

    context = {"types":result}

    print "=========context========",context

    return render_to_response('dashboard_detail.html',context)

@task(ignore_result=True)
def hosts_operations_action(es__operation,action,_operation,job_id):
    ret = ""
    if not es__operation == set():

        result = web_request(','.join(list(es__operation)),'elasticsearch.' + action,[],None,None)

        ret = ret +  str(result)

    for _tem,_targ in _operation.items():
        print "_tem,_targ ",_tem,_targ
        for _conf_key,_target_list in _targ.items():
            _machine_l = _conf_key.split(",")
            _cf = _target_list

            result = web_request(','.join(list(_machine_l)),_tem + '.' + action,_cf,None,None)
            ret =  ret  + str(result)

    with salt.utils.fopen(files_path + "/" + job_id , 'w') as fp_:
        print >> fp_,ret
    with salt.utils.fopen(files_path + "/" + job_id + "_flag", 'w') as fp_:
        print >> fp_,"finish"

def hosts_operations(request):

    id = request.POST.get("id",None)

    action = request.POST.get("action",None)

    context = {"status":"ok","result":[]}



    try:
        if id == None:
             raise NameError,"请选择instance"

        _id_list = id.split("&")

        _item = instance_machine.objects.filter(id__in=_id_list)

        _operation = {}

        es__operation = set()

        for _ele in _item:

            try:
                _target = machine.objects.get(id=int(_ele.machine_id)).target
            except:
                logger.error("_target fail " + traceback.format_exc())
                context["result"].append([machine_id,u"instance记录不存在"])
                continue

            try:
                _role = role.objects.get(id=int(_ele.role_id))
                _template = _role.service.type
            except:
                logger.error("_role fail " + traceback.format_exc())
                context["result"].append([machine_id,u"无法找到对应模板"])
                continue

            if _template == "elasticsearch":
                es__operation.add(_target)

            elif _template not in _operation:
                _operation[_template] = {}

            if not _template == "elasticsearch" and not _target in _operation[_template]:
                _operation[_template][_target] = []

            try:
                _relative_conf = role_configure.objects.filter(role_id=_role.id).values("conf")
                _conf = template_configure.objects.filter(id__in=[x["conf"] for x in _relative_conf]).values("name")
                _conf = [x["name"] for x in _conf]
            except:
                logger.error("_relative_conf fail " + traceback.format_exc())
                continue


            if not _template == "elasticsearch":
                _operation[_template][_target].extend(_conf)


        _op = {}
        for _template,_target in _operation.items():
            if not _template in _op:
                _op[_template] = {}

            for _tar,_conf_list in _target.items():
                tm = list(set(_conf_list))
                tm.sort()
                _conf_key = ",".join(tm)

                if _conf_key not in _op[_template]:
                    _op[_template][_conf_key] = set()

                _op[_template][_conf_key].add(_tar)




        #if not es__operation == set():
        #    result = local.cmd(list(es__operation), 'elasticsearch.' + action, [],timeout=60, expr_form="list")
        #    for k,v in result.items():
        #        ret = ret +  str(k) + " : " + str(v)
        #
        #for _tem,_targ in _operation.items():
        #    print "_tem,_targ ",_tem,_targ
        #    for _conf_key,_target_list in _targ.items():
        #        _machine_l = _conf_key.split(",")
        #        _cf = _target_list
        #
        #        result = local.cmd(list(_machine_l), _tem + '.' + action, _cf,timeout=60, expr_form="list")
        #
        #        for k,v in result.items():
        #            ret =  ret + str(k) + " : " + str(v) + "\n\n"
        job_id = str(uuid.uuid1())
        hosts_operations_action.delay(es__operation,action,_operation,job_id)
        context['job_id'] = job_id
    except:
        logger.error("hosts_operations " + traceback.format_exc())
        print ( "hosts_operations " + traceback.format_exc() )
        context = {"status":"failed"}
    
    return HttpResponse(json.dumps(context))






def _host_ope(ser_id,instance_id):


    __add_sql = ""

    __fetch_sql = '''
    select machine.target,
    machine.IP,
    cluster.cluster,
    role.name,
    machine.status,
    instance_machine.status,
    machine.id,
    instance_machine.id,
    services_template.icon,
    instance_machine.last_check 
    from machine
    INNER JOIN instance_machine
    ON machine.id = instance_machine.machine_id
    LEFT JOIN services
    ON services.id = instance_machine.ser_id
    LEFT JOIN services_template
    ON services_template.id = services.belong_template
    LEFT JOIN role
    ON role.id = instance_machine.role_id
    LEFT JOIN cluster
    ON cluster.id = machine.cluster
    '''

    if instance_id == None and not ser_id == None:
        __add_sql = '''
                    where services.id = {0}
                    order by machine.target
                    '''.format(ser_id)

    elif not instance_id == None and  ser_id == None:
        __add_sql = '''
                    where instance_machine.id = {0}
                    order by machine.target
                    '''.format(instance_id)

    else:
        __add_sql = '''
                    order by machine.target
                    '''
        
    __fetch_sql = __fetch_sql +  __add_sql


    _current_time = mktime(time.localtime())
    context = {"host_list": []}
    cursor = connection.cursor()
    cursor.execute(__fetch_sql)
    raw = cursor.fetchall()

    ret = []
    host = []
    for item in raw:
        ip = item[1]
        roles = []
        if item[1] in host:
            continue
        else:
            host.append(item[1])

            for item1 in raw:
                if ip == item1[1]:

                    try:
                        _refresh_time =  mktime(time.strptime(item1[9], "%Y-%m-%d %H:%M:%S"))
                    except:
                        _refresh_time =  mktime(time.strptime('2008-02-14', '%Y-%m-%d'))

                    if _current_time - _refresh_time > 60:
                        status = 0
                    else:
                        status = 1

                    roles.append([ item1[3], item1[7], item1[8], status])
                    #print roles

            result = {"hostname":item[0],"IP":item[1],"cluster":item[2],
                      "role":roles,"status":item[4],"status":item[5],"role_total":len(roles),"id":item[6]
                      }
        
            ret.append(result)

    return ret



def host(request):
    
    ret = _host_ope(None,None)
    context = {}
    context["host_list"] = ret

    context["refresh_time"] = str(datetime.datetime.now())
    context.update(csrf(request))
    return render_to_response('hosts.html',context,RequestContext(request))


def instances(request):

    server_id   =  request.GET.get("service_id",None)
    instance_id =  request.GET.get("instance_id",None)

    ret =  _host_ope(server_id,instance_id)
    context = {}
    context["host_list"] = ret
    context["refresh_time"] = str(datetime.datetime.now())
    context.update(csrf(request))
    return render_to_response('hosts.html',context,RequestContext(request))



def ser_command(request):

    com =  request.POST.get("com",None)
    id  =  request.POST.get("id",None)
    new_name =  request.POST.get("new_name",None)

    context = {"status":"ok"}

    try:
        salt_com = {"start":0, "stop":0,"retart":0}

        database_com = {"rename":0,"delete":0}

        if com not in salt_com and com not in database_com:
            raise NameError,u"操作无效"

        try:
            ser = services.objects.get(id=int(id))
            ser_id = ser.id
        except:
            raise IndexError,u"找不到对应的服务"

        __fetch_target = '''
        select machine.IP from machine
        INNER JOIN instance_machine
        ON machine.id = instance_machine.machine_id
        where instance_machine.ser_id = {0};
        '''.format(ser_id)

        cursor = connection.cursor()
        cursor.execute(__fetch_target)
        raw = cursor.fetchall()

        if com in salt_com:
            #target先用list做
            import salt.client
            local  = salt.client.LocalClient()
            #local = None
            result = local.cmd(raw, 'logstash.' + com, [],timeout=10,expr_form="list")
            context["detail"] = result
        elif com == "rename":

            ser.name = new_name
            ser.save()

            #修改这个cluster的 pillar信息
            _type = ser.belong_template.type
            name  = ser.belong_template.name

        try:
            web_request("master","pillar_module.pillar_operation",[name,ser.name],_type,"rm_cluster")
        except:
            logger.error("ser_command " + traceback.format_exc())

        try:
            web_request("master","pillar_module.pillar_operation",[name,new_name],_type,"add_cluster")
        except:
            logger.error("ser_command " + traceback.format_exc())


        else:
            #删除逻辑               
            instance_machine.objects.filter(ser_id=int(id)).delete()
            ser.delete()

            _type = ser.belong_template.type
            name  = ser.belong_template.name
            try:
                web_request("master","pillar_module.pillar_operation",[name,ser.name],_type,"rm_cluster")
            except:
                logger.error("ser_command " + traceback.format_exc())

        web_request("master","pillar_module.pillar_operation",[],None,"_refresh")
    except Exception,e:
        logger.error("ser_command " + traceback.format_exc())
        context = {"status":"fail","reason":e}


        
    return HttpResponse(json.dumps(context))

#@login_required
def services_display(request):
    try:
        st = services_template.objects.all()
        cl = cluster.objects.all()

        context = {"result": []}

        _current_time = mktime(time.localtime())


        for item in cl:
            all_machine = {"machine_list":[]}

            all_machine["id"] = item.id
            all_machine["name"] = item.name

            #获取所有机器
            _machine = machine.objects.filter(cluster=item.id)

            #根据机器id去查这些机器关联的instance
            im = instance_machine.objects.filter(machine_id__in=[x.id for x in _machine])

            ser_item = services.objects.filter(id__in=[x.ser_id for x in im])

            result = []

            #遍历每个ser
            for item in ser_item:
                ser_dict = {}
                #如果是es集群，只需要拿到这个ser的所有机器

                ser_dict["id"] = item.id
                ser_dict["name"] = item.name
                ser_dict["icon"] = item.belong_template.icon
                ser_dict["template"] = item.belong_template.type
                ser_dict["template_name"] = item.belong_template.name
                #遍历这个ser所有的实例
                all_instance = instance_machine.objects.filter(ser_id=item.id)

                #拿到机器
                all_ma = machine.objects.filter(id__in=[x.machine_id for x in all_instance])

                machine_list = []
                for machine_item in all_ma:

                    machine_dict = {}
                    machine_dict["machine"] = machine_item
                    machine_instance = instance_machine.objects.filter(machine_id=machine_item.id,ser_id=item.id)

                    machine_dict["role"] = []
                    _role = role.objects.filter(id__in=[x.role_id for x in machine_instance])
                    for role_item in _role:                        
                        single_role = {}
                        single_role["role"] = role_item
                        if not  item.belong_template.type.lower() == "elasticsearch":
                            _temp_conf = set()
                            for x in role_conf_item.objects.filter(role_id=role_item):
                                _conf = x.configure_item.template_configure_id
                                _temp_conf.add(_conf)
                            single_role["role_conf"] = list(_temp_conf)

                        machine_dict["role"].append(single_role)

                    if  item.belong_template.type.lower() == "elasticsearch":

                        try:
                            _refresh_time = mktime(time.strptime(machine_instance[0].last_check, "%Y-%m-%d %H:%M:%S"))
                        except:
                            _refresh_time = mktime(time.strptime('2008-02-14', '%Y-%m-%d'))


                        if _current_time - _refresh_time > 60:
                            status = 0
                        else:
                            status = 1

                        machine_dict["machine_state"] = status

                    machine_list.append(machine_dict)

                



                ser_dict["instance"] = machine_list

                result.append(ser_dict)

            all_machine["service"] = result

            context["result"].append(all_machine)

    except Exception,e:
        logger.error("services_display " + traceback.format_exc())
        context = {"status":"fail","reason":e}        

    context["refresh_time"] = str(datetime.datetime.now())
    context.update(csrf(request))

    print "============context==============",context
    return render_to_response('service.html', context,RequestContext(request))



def instance_status(request):

    try:
        id = request.POST.get("id",None)
        #print id
        import time
        _current_time = mktime(time.localtime())

        context = {"status":"ok","result":{}}

        id = id.split("&")

        for item in id:
            flag = True
            try:
                ser_id,machine_id = item.split("_")
                flag = False
            except:
                instance_id = item
            last_check = None
            try:
                if flag:
                    _time = instance_machine.objects.filter(id=instance_id)[0]
                else:
                    _time = instance_machine.objects.filter(machine_id=machine_id,ser_id=ser_id)[0]
                last_check = _time.last_check
                if not last_check == None:
                    _refresh_time = mktime(time.strptime(last_check, "%Y-%m-%d %H:%M:%S"))
                else:
                    _refresh_time = mktime(time.strptime('2008-02-14', '%Y-%m-%d'))
            except:
                _refresh_time = mktime(time.strptime('2008-02-14', '%Y-%m-%d'))
            if _current_time - _refresh_time > 60:
                status = 0
            else:
                status = 1

            context["result"][item] = [status,last_check]

    finally:
        context["_refresh_time"] = str(datetime.datetime.now())
        #logger.error("instance_status " + traceback.format_exc())
        return HttpResponse(json.dumps(context)) 


def add_host(request):
    context = {"status":"ok","result":{}}
    return HttpResponse(json.dumps(context)) 


