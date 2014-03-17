#coding=utf-8
from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import get_template
from django.template import Context
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from django.conf import settings
from elasticsearch.models import *
from django.db import connection
from elasticsearch import logger
import json,traceback,os,re,traceback,uuid,re,copy
from elasticsearch.salt_api import __fetch_machine_info
from elasticsearch import logger

from _pillar.pillar_op import *

files_path = os.path.join(
            os.path.join(
                os.path.dirname(
                        os.path.abspath(os.path.dirname(__file__))
                    ), 
                "static"
            ), 
            "img"
        )


class mock_http:
    def __init__(self,dict):
        self.POST = dict


def auto_load_file(name,sepa,deploy_path,reg,st):
    con = template_configure()
    con.name = name
    con.sepa = sepa
    con.deploy_path = deploy_path
    con.services_template_id = st
    con.save()        
    request = {"name":name,"reg":reg,"id":"o_" + str(con.id),"checked":"","mock_flag":1}
    a = mock_http(request)
    _configure_add_reg(a)


def check_role(role_item,conf_item):
    request = {"role_id_array":str(role_item.id),"id":str(conf_item.id),"add_array":"checked","del_array":""}
    a = mock_http(request)
    role_configure_relative(a)
    cc = role_conf_item.objects.get(role_id=role_item,configure_item=conf_item)
    request = {"role_conf_id":str(cc.id),"name":"True","mock_http":"True"}
    a = mock_http(request)
    role_conf_configure_commit(a)

def auto_load(request):
    name = request.POST.get("name","").replace(".","_")
    ope = request.POST.get("ope",None)

    if ope == "new_es":
        ret = es_load(name)
    else:
        ret = logstash_load(name)

    return HttpResponse(json.dumps(ret))


def logstash_load(name):
    ret = {"status":"ok"}
    try:
        st = services_template.objects.get(name=name)
        ret = {"status":"fail","result":"已存在同名模板，不允许再创建哦"}
    except:
        try:
            request = {"name":name,"desc":"logstash","img":"logstash.png","type":"logstash","mock_flag":True}
            a = mock_http(request)
            _add(a)
        except Exception,e:
            traceback.print_exc()
            ret["status"] = "fail"
            ret["result"] = e
            logger.error("fetch_role " + traceback.format_exc())                

    return ret


def es_load(name):
    ret = {"status":"ok"}
    try:
        st = services_template.objects.get(name=name)
        ret = {"status":"fail","result":"已存在同名模板，不允许再创建哦"}
    except:

        try:
            request = {"name":name,"desc":"elasticsearch","img":"elasticsearch.png","type":"elasticsearch","mock_flag":True}
            a = mock_http(request)
            _add(a)
            st = services_template.objects.get(name=name)
            for item in ["masternode","datanode","http"]:
                request = {"name":item,"id":st.id}
                a = mock_http(request)
                _add_role(a)


            #然后录入文件
            auto_load_file("90-nproc.conf"," ","/etc/security/limits.d/",r"[\n]?([*\w\s#]+?)[ ]{1}([\w]+)[\n]",st)

            auto_load_file("limits.conf"," ","/etc/security/",r"[\n]?([*\w\s#]+?)[ ]{1}([\w]+)[\n]",st)

            auto_load_file("elasticsearch.yml",": ","",r"[\r\n]+[#]?[ ]*([^: ]+)[ ]*:[ ]*([^\r\n]+)",st)

            auto_load_file("logging.yml",": ","",r"([^:\n]+):([\s\S]*?)(?=[\n]{2}|$)",st)

            #有个配置 写不出合适的regex能匹配出来，只有手工增加了
            el_con = template_configure.objects.get(name="elasticsearch.yml",services_template_id=st)
            index_item = configure()
            index_item.template_configure_id = el_con
            index_item.key = "index"
            index_item.value = '\n    analysis :\n        analyzer :\n            key_lowercase :\n                tokenizer : keyword\n                filter : [lowercase]'
            index_item.save()

            auto_load_file("elasticsearch.in.sh","=","/home/op1/app/elasticsearch/bin/",r"(?<=\n)([^=\n]+)=([\s\S]*?)(?=\n\n)",st)

            #找到配置文件
            conf_90 = template_configure.objects.get(name="90-nproc.conf",services_template_id=st)
            conf_limit = template_configure.objects.get(name="limits.conf",services_template_id=st)
            conf_log = template_configure.objects.get(name="logging.yml",services_template_id=st)
            conf_in = template_configure.objects.get(name="elasticsearch.in.sh",services_template_id=st)

            #找到敢刚增加的文件中的master，data，http三个配置项
            master = configure.objects.get(key="node.master",template_configure_id = el_con)
            data   = configure.objects.get(key="node.data",template_configure_id = el_con)
            http   = configure.objects.get(key="http.enabled",template_configure_id = el_con)

            #三个role
            role_master = role.objects.get(name="masternode",service=st)
            role_data = role.objects.get(name="datanode",service=st)
            role_http = role.objects.get(name="http",service=st)

            check_role(role_master,master)
            check_role(role_data,data)
            check_role(role_http,http)

            #每个role都关联每份配置文件
            for item in configure.objects.filter(key="#relative_role",template_configure_id__in=[conf_90,conf_limit,conf_log,conf_in]):
                for _role_item in map(str,[role_master.id,role_data.id,role_http.id]):
                    request = {"role_id_array":_role_item,"id":str(item.id),"add_array":"checked","del_array":""}
                    a = mock_http(request)
                    role_configure_relative(a)

        except Exception,e:
            traceback.print_exc()
            ret["status"] = "fail"
            ret["result"] = e
            logger.error("fetch_role " + traceback.format_exc())                           

    return ret


def fetch_role(request):
    id = request.POST.get("id",None)
    ret = {"status":"ok"}
    result = []
    try:
        st = services_template.objects.get(id=id)

        all_role = role.objects.filter(service=st)

        result = [[x.id,x.name] for x in all_role]
        ret["result"] = result

    except Exception,e:
        traceback.print_exc()
        ret["status"] = "fail"
        ret["result"] = e
        logger.error("fetch_role " + traceback.format_exc())

    return HttpResponse(json.dumps(ret))         


def role_configure_relative(request):
    id = request.POST.get("id","").split("&")
    role_id_array = request.POST.get("role_id_array","").split("&")
    add_array = request.POST.get("add_array","").split("&")
    del_array = request.POST.get("del_array","").split("&")
    ret = {"status":"ok"}

    try:
        role_id_array = [role.objects.get(id=x)  for x in role_id_array]

        meta = zip(role_id_array,add_array,del_array)

        _conf_file = []

        for item in id:

            conf_item = configure.objects.get(id=item)
            if  _conf_file == []:
                _conf_file = [conf_item.template_configure_id]

            for index,item in enumerate(meta):
                #需要删除
                add = item[1]
                delete = item[2]
                if delete == "checked":
                    try:
                        item = role_conf_item.objects.filter(role_id=item[0],configure_item=conf_item).delete()
                    except:
                        logger.error("role_configure_relative " + traceback.format_exc())

                if add == "checked":                       
                    try:
                        item = role_conf_item.objects.get(role_id=item[0],configure_item=conf_item)
                    except:
                        new_rc = role_conf_item()
                        new_rc.role_id = item[0]
                        new_rc.configure_item = conf_item
                        new_rc.value = conf_item.value
                        new_rc.save()
        __refresh_conf(_conf_file)

        for item in role_id_array:
            type = item.service.type
            name = item.service.name
            try:
                web_request("master","pillar_module.pillar_operation",[name,item.name],type,"add_role")
            except:
                logger.error("modify " + traceback.format_exc())


        #还需要获取关联该role的所有机器，因为要刷新这些机器的 配置文件的pillar信息
        web_request("master","pillar_module.pillar_operation",[],None,"_refresh")

    except:
        logger.error("role_configure_relative " + traceback.format_exc())

    return HttpResponse(json.dumps(ret))    




def _commit_role_conf(request):
    '''
    role关联的配置文件修改，修改role_configure
    '''
    role_array = request.POST.get("role_array","").split("&")
    conf_id = request.POST.get("conf_id","").split("&")

    ret = {"status":"ok"}

    try:

        role_conf = zip(role_array,conf_id)

        for item in role_conf:
            conf_id = []
            for x in item[1].split("_"):
                if x.isdigit():
                    conf_id.append(int(x))
            role_id = item[0]

            #获取每个role对应的所有配置文件的集合
            role_conf_id_set = set([int(x["conf"]) for x in role_configure.objects.filter(role_id=role_id).values("conf")])


            conf_id_set      = set(conf_id)


            #获取需要删除的配置文件id列表
            need_del = role_conf_id_set - conf_id_set

            #先清空 role_configure在role_conf_item中保存的 所有自定义的配置
            need_del_item = role_configure.objects.filter(role_id=role_id,conf__in=list(need_del))
            for need_del_one in need_del_item:

                role_conf_item.objects.filter(role_conf=need_del_one.id).delete()

            #然后删除保存在role_configure中的 role conf组合
            need_del_item.delete()

            #获取新加的配置文件id列表
            need_add = conf_id_set - role_conf_id_set

            for conf_id_item in list(need_add):

                if conf_id_item == None:
                    continue

                #先在 role_configure中 保存 role conf的组合
                rc = role_configure()
                rc.role_id = role_id
                rc.conf    = conf_id_item
                rc.save()

                try:
                    conf_file = template_configure.objects.get(id=conf_id_item)
                except:
                    traceback.print_exc()
                    continue

                all_conf_item = configure.objects.filter(template_configure_id=conf_file)
                for item in all_conf_item:
                    rci = role_conf_item()
                    rci.role_conf = rc
                    rci.configure_item = item
                    rci.value = item.value
                    rci.save()



        web_request("master","pillar_module.pillar_operation",[],None,"_refresh")
    
    except Exception,e:
        traceback.print_exc()
        ret["status"] = "fail"
        ret["result"] = e
        logger.error("_commit_role_conf " + traceback.format_exc())



    return HttpResponse(json.dumps(ret)) 


def _get_role_conf(request):
    '''
    获取role list中的每个role 对应的 所有配置文件
    '''
    _id_list = request.POST.get("id","").split("&")

    result = []

    for item in _id_list:
        try:
            ret = {}
            _role_item = role.objects.get(id=item)

            ret["name"] = _role_item.name
            ret["id"]   = _role_item.id
            ret["conf"] = []

            _template  = _role_item.service

            _template_name = _template.name

            _rc        = role_configure.objects.filter(role_id=_role_item.id)

            _conf      = template_configure.objects.filter(services_template_id=_template)

            _conf_ele = {}

            for _item in _rc:
                _conf_ele[_item.conf] = 0

            for _item in _conf:
                tag = 0
                if _item.id in _conf_ele:
                    tag = 1
                ret["conf"].append([tag,_item.id,_item.name])

            result.append(ret) 
        except:
            traceback.print_exc()
            logger.error("_configure_add_reg " + traceback.format_exc()) 
            continue

    ret = {"status":"ok","result":result,"tn":_template_name}
    return HttpResponse(json.dumps(ret))       


def conf_file(request):
    '''
    展现conf_file 页面
    '''
    context = {}

    id = request.GET.get("template_id",None)
    try:
        try:
            tem = services_template.objects.get(id=int(id))
        except:
            raise NameError,u"模板不存在"

        context["template"] = tem

        try:
            context["len"] = 0
            conf = template_configure.objects.filter(services_template_id=tem)
            for item in conf:
                context["len"] = 1 
        except:
            traceback.print_exc()
            conf = None


        context["conf"] = conf



    except:
        logger.error("_configure " + traceback.format_exc())
        #这里需要处理


    return render_to_response('conf_file.html',context,RequestContext(request))



def _role(request):
    '''
    展现role.html页面
    '''
    _template_id = request.GET.get("template_id",None)

    _role = None
    context = {}

    try:
        try:
            _template = services_template.objects.get(id=int(_template_id))
            context["template"] = _template

        except:
            logger.error("_configure_add_reg " + traceback.format_exc())           
            raise IndexError,"template id is invalid"

        role_conf = []

        _role = role.objects.filter(service=_template)

        for item in _role:
            _result = template_configure.objects.filter(id__in=[ x.configure_item.template_configure_id.id for x in role_conf_item.objects.filter(role_id=item) ])

            role_conf.append([item,_result])

    except:
        logger.error("_role " + traceback.format_exc())

    context["role"] = role_conf


    return render_to_response('role.html',context,RequestContext(request))


        




def _configure_content(request):
    '''
    当用户左击某个配置文件后，返回这个配置文件的所有配置项,每个配置项关联的role
    '''
    _id  = request.POST.get("id",None)

    result = {"status": "ok","result":[]}

    try:
        id = _id.split("_")[1]

        _tc = template_configure.objects.get(id=int(id))

        con = configure.objects.filter(template_configure_id=_tc).exclude(key__in=["#relative_role","node.master","node.data","http.enabled"])

        for item in con:
            role_name = role_conf_item.objects.filter(configure_item=item)
            role_array = [[x.id,x.role_id.name] for x in role_name]

            value = item.value.replace("\n","</br>").replace(" ","&nbsp")
            result["result"].append({"key":item.key,"value":value,"id":item.id,"role":copy.deepcopy(role_array)})
    except:
        traceback.print_exc()
        logger.error("_configure_content " + traceback.format_exc())
        result["status"] = "fail"


    return HttpResponse(json.dumps(result))


def _configure_add_reg(request):
    '''
    录入文件中的所有配置
    '''
    _name = request.POST.get("name","").strip()
    _reg  = request.POST.get("reg",None)
    _id   = request.POST.get("id",None)
    _checked = request.POST.get("checked",None)
    _mock_flag = request.POST.get("mock_flag",None)

    try:
        try:
            id = _id.split("_")[1]
            _tc = template_configure.objects.get(id=int(id))
        except:
            raise IndexError,"configure id is wrong"

        conf_ele = {}

        #获取关联这份配置文件的所有role
        with open(os.path.join(files_path, _name), 'r') as destination:
            _content = destination.read()
            m = re.findall(_reg,_content)

            for item in m:
                if not len(item) == 2:
                    continue

                if len(re.findall(r'[<>]',item[0])):
                    continue

                if _checked == "checked" and item[0].strip() in conf_ele:
                    continue

                if  _checked == "checked":
                    conf_ele[item[0].strip()] = 0

                co = configure()
                co.template_configure_id = _tc
                co.key = item[0].strip()
                co.value = item[1].rstrip()
                co.save()

        result = {"status": "ok"}

        __refresh_conf([_tc])
    except:
        logger.error("_configure_add_reg " + traceback.format_exc())
        result = {"status": "fail"}      

    if _mock_flag:
        return
    else:
        return HttpResponse(json.dumps(result)) 


def _configure_add_file(request):
    '''
    上传文件
    '''
    try:
        f = request.FILES.get("configure_file",None)

        name = str(uuid.uuid4())   
        with open(os.path.join(files_path, name), 'wb') as destination:
            for chunk in f.chunks():
                destination.write(chunk)

        result = {"status": "ok", "filename": name}
    except:
        logger.error("_configure_add_file " + traceback.format_exc())
        result = {"status": "fail", "filename": name}

    return HttpResponse(json.dumps(result)) 



def _del(request):
    '''
    删除整个template
    '''
    id = request.POST.get("id",None)

    try:

        item = services_template.objects.get(id=int(id))
        result = {"status": "ok"}

        type = item.type
        name = item.name
        try:
            web_request("master","pillar_module.pillar_operation",[name,"temp"],type,"sub_template")
        except:
            logger.error("modify " + traceback.format_exc())


        #还需要删除所有该cluster的 role，ser，instance,configure_file,configure
        sv = services.objects.filter(belong_template=item)
        for sv_item in sv:
            instance_machine.objects.filter(ser_id=sv_item.id).delete()
            indices.objects.filter(ser=sv_item).delete()
        sv.delete()

        rl = role.objects.filter(service=item)
        for rl_item in rl:
            rl_conf = role_conf_item.objects.filter(role_id=rl_item).delete()

        rl.delete()

        cf = template_configure.objects.filter(services_template_id=item)
        for cf_item in cf:
            conf = configure.objects.filter(template_configure_id=cf_item)
            conf.delete()

        cf.delete()

        item.delete()

        #更新所有target的pillar信息
        web_request("master","pillar_module.pillar_operation",[],None,"_refresh")
        #还要删除source配置
        soure_root = settings.SOURCE_ROOT
        template_path = soure_root + "/" + '/'.join([item.type,item.name])
        from shutil import rmtree
        rmtree(template_path)
    except:
        logger.error("_del " + traceback.format_exc())
        result = {"status": "fail"}

    return HttpResponse(json.dumps(result))      


def _add(request):
    '''
    创建template
    '''
    name = request.POST.get("name","default").strip()
    desc = request.POST.get("desc",'').strip()
    icon = request.POST.get("img",None)
    type = request.POST.get("type",name)
    mock_flag = request.POST.get("mock_flag",False)
    try:
        st = services_template()
        st.name = name
        st.description = desc
        st.type = type
        st.icon = icon
        st.save()

        template_name = name

        try:
            web_request("master","pillar_module.pillar_operation",[template_name,"temp"],type,"add_template")
        except:
            logger.error("modify " + traceback.format_exc())

        result = {"status": "ok"}

    except Exception,e:
        logger.error("_add " + traceback.format_exc())

        result = {"status": "fail","result":str(e)}

    if not mock_flag:
        return HttpResponse(json.dumps(result))
    else:
        return


def _add_file(request):
    '''
    增加template时上传图标
    '''
    try:
        f = request.FILES.get("upload_file",None)

        name = str(uuid.uuid4())   
        with open(os.path.join(files_path, name), 'wb') as destination:
            for chunk in f.chunks():
                destination.write(chunk)

        result = {"status": "ok", "filename": name}
    except:
        logger.error("_add_file " + traceback.format_exc())
        result = {"status": "fail", "filename": name}

    return HttpResponse(json.dumps(result))   


def _template(request):
    '''
    展现template页面
    '''
    context = {"template":[]}

    __fetch_sql = '''
    select services_template.name as `template.name`,
    services_template.description as `template.desc`,
    services_template.icon as `template.icon`,
    role.id as `role.id`,
    role.name as `role.name`,
    template_configure.id as `configure.id`,
    template_configure.name as `configure.name`,
    services_template.id as `template.id`
    from services_template
    LEFT JOIN role
    ON role.service = services_template.id
    LEFT JOIN template_configure
    ON template_configure.services_template_id = services_template.id;
    '''
    cursor = connection.cursor()
    cursor.execute(__fetch_sql)
    raw = cursor.fetchall()

    ret = []

    count = 0
    last_cluster_name = ""

    for item in raw:
        count =+ 1
        if not item[0] == last_cluster_name:

            if not last_cluster_name == "":
                result["role"] = set(result["role"])
                result["template"] = set(result["template"])
                ret.append(result)

            last_cluster_name = item[0]

            result = {"id":item[7],"name":item[0],"desc":item[1],"icon":item[2],"role":[],"template":[]}

        result["role"].append((item[3],item[4]))
        result["template"].append((item[5],item[6]))

    if count:
        result["role"] = set(result["role"])
        result["template"] = set(result["template"])
        ret.append(result)

    context["template"] = ret
    context.update(csrf(request))
    return render_to_response('template.html',context,RequestContext(request))



def _configure(request):
    '''
    展现configure页面
    '''
    context = {}

    id = request.GET.get("template_id",None)

    try:
        try:
            tem = services_template.objects.get(id=int(id))
        except:
            raise NameError,u"模板不存在"

        context["template"] = tem

        try:
            rl = role.objects.filter(service=tem)
        except:
            rl = None

        context["role"] = rl

    except:
        logger.error("_configure " + traceback.format_exc())
        #这里需要处理


    return render_to_response('configure.html',context,RequestContext(request))

def _add_configure(request):
    '''
    增加配置文件
    '''
    id = request.POST.get("id",None)
    name = request.POST.get("name","").strip()
    create_role = request.POST.get("create_role",None)
    spera = request.POST.get("spera",None)
    deploy_path = request.POST.get("deploy_path","").strip().rstrip("/")
    if not deploy_path == "":
        deploy_path = deploy_path + "/"
    try:
        try:
            new_item = template_configure()
            new_item.name = name
            new_item.services_template_id = services_template.objects.get(id=int(id))
            new_item.sepa = spera
            new_item.deploy_path = deploy_path
            result = {"status": "ok", "filename": name}
            new_item.save()
        except:
            logger.error("_add_configure " + traceback.format_exc())
            result = {"status": "fail", "filename": name}
            raise NameError,"save template wrong"


        if create_role == "checked":
            name = name.replace(".","_")
            new_role = role()
            new_role.name = name
            new_role.service = services_template.objects.get(id=int(id))
            new_role.save()

            
            type = new_role.service.type
            name = new_role.service.name

            try:
                web_request("master","pillar_module.pillar_operation",[name,new_role.name],type,"add_role")
            except:
                logger.error("modify " + traceback.format_exc())                    

    except Exception,e:
        logger.error("_add_configure " + traceback.format_exc())
        result = {"status": "fail", "reason": str(e)} 
    return HttpResponse(json.dumps(result))


def _add_role(request):
    '''
    增加role
    '''
    id = request.POST.get("id",None)
    name = request.POST.get("name",str(uuid.uuid4())).strip().replace(".","_")

    try:
        new_item = role()
        name = name.replace(".","_").strip()
        new_item.name = name
        new_item.service = services_template.objects.get(id=int(id))
        result = {"status": "ok", "filename": name}
        new_item.save()

        type = new_item.service.type
        name = new_item.service.name
        try:
            web_request("master","pillar_module.pillar_operation",[name,new_item.name],type,"add_role")
        except:
            logger.error("modify " + traceback.format_exc())  
    except:
        logger.error("_add_role " + traceback.format_exc())
        result = {"status": "fail", "filename": name}        

    return HttpResponse(json.dumps(result))   


def ___recu_mkdir(name):
    name = name.split("/")
    root = "/"
    for i in range(0,len(name)):
        if name[i] == "":
            continue
        root = root + name[i] + "/"
        if not os.path.isdir(root):
            mask = os.umask(002)
            os.mkdir(root)
            os.umask(mask)

def __refresh_conf(idlist):
    '''
    传参是 配置文件的queryset
    '''
    if not type(idlist) == list:
        return

    idlist = list(set(idlist))
    for item in idlist:
        name = item.name
        sepa = item.sepa
        template_name = item.services_template_id.name                 
        _type = item.services_template_id.type
        '''
        获取真正的value,逻辑是根据每个配置，去查这个配置有多少个role在关联
        体现在 如果有 role关联了这个配置项，在role.sls文件中 应该有pillar关联
        拼装方式是 {{pillar.masternode|default('false')}}
        这样做有很大的局限性，因为设死了这种配置的格式
        格式是： (pillar[key]) | 缺省值
        在各个role的sls中 各自重写了pillar[key]的值
        '''
        conf = configure.objects.filter(template_configure_id=item)

        '''
        fix:修改逻辑：不同文件写到不同template下,type标识 是es还是logstash还是啥
        '''

        soure_root = settings.SOURCE_ROOT

        try:
            template_path = soure_root + "/" + '/'.join([_type,template_name])
            ___recu_mkdir(template_path)
        except:
            traceback.print_exc()

        with open(os.path.join(template_path, name), 'w') as destination:
            for conf_item in conf:
                value = conf_item.value
                try:
                    rci = role_conf_item.objects.filter(configure_item=conf_item)
                    for item in rci:
                        value = "{{pillar." + str(item.configure_item.id) + "|default('" + value + "')}}"
                        break
                except:
                    d = 1
                print >> destination,sepa.join((conf_item.key,value))


def _configure_pair(request):
    '''
    用户增加某个配置文件的 单个配置项
    '''
    id = request.POST.get("id",None)
    name = request.POST.get("name",None)
    value = request.POST.get("value",None)
    _id = request.POST.get("_id",None)
    try:
        try:
            id = _id.split("_")[1]
            _tc = template_configure.objects.get(id=int(id))
        except:
            raise IndexError,"configure id is wrong"

        co = configure()
        co.template_configure_id = _tc
        co.key = name
        co.value = value
        co.save()

        __refresh_conf([_tc])
    except:
        logger.error("_add_role " + traceback.format_exc())

    result = {"status": "ok"}
    return HttpResponse(json.dumps(result))


def _configure_modify(request):
    '''
    修改某个配置的 value
    '''
    id = request.POST.get("id",None)
    context = request.POST.get("context",None)
    result = {"status": "ok"}

    conf_file = []

    try:
        id = id.split("&")
        context = context.split("&sperate&")
        element = zip(id,context)

        for item in element:
            try:
                conf = configure.objects.get(id=int(item[0]))  #得到配置项
                _tc = conf.template_configure_id               #得到包含配置项的配置文件                
            except:
                traceback.print_exc()
                continue
            conf.value = item[1].replace("\\n","\n")
            conf.save()

            conf_file.append(conf.template_configure_id)

        __refresh_conf(conf_file)

    except:
        result["status"] = "fail"
        logger.error("_configure_modify " + traceback.format_exc())

    return HttpResponse(json.dumps(result))


def _role_configure(request):
    '''
    获取某个role对应的某个配置的 值
    '''
    configure_id = request.GET.get("configure_id",None)
    role_id = request.GET.get("role_id",None)
    result = {"status": "ok"}

    try:        
        rc = role_conf_item.objects.get(id=role_id)
        result["result"] = rc.value
    except:
        traceback.print_exc()
        result["status"] = "fail"
        logger.error("_configure_modify " + traceback.format_exc())        

    return HttpResponse(json.dumps(result))

def role_conf_configure_commit(request):
    '''
    修改role关联的配置项的值
    '''
    role_conf_configure_id = request.POST.get("role_conf_configure_id",'')
    role_conf_id           = request.POST.get("role_conf_id",'')
    name                   = request.POST.get("name","").replace("\\n","\n")
    mock_flag              = request.POST.get("mock_http",False)
    result = {"status": "ok"}

    try:
        rc = role_conf_item.objects.get(id=role_conf_id)
        rc.value = name
        rc.save()

        '''
        __refresh_conf([rc.configure_item.template_configure_id])
        接着在pillar的role里边 重写 该role对应的配置的值,写的格式是
        这个配置在数据库configure表中的id: |
          role对应的value
        '''
        type = rc.role_id.service.type
        name = rc.role_id.service.name

        try:
            web_request("master","pillar_module.pillar_operation",[name,rc.role_id.name],type,"add_role")
        except:
            logger.error("modify " + traceback.format_exc())

    except:
        traceback.print_exc()
        result["status"] = "fail"

    if not mock_flag: 
        return HttpResponse(json.dumps(result))
    else:
        return


def fetch_file_info(request):
    '''
    获取配置文件的信息
    '''
    result = {"status": "ok"}
    try:
        id = request.POST.get("id","_None").split("_")[1]

        tc = template_configure.objects.get(id=id)
        result["name"] = tc.name
        result["path"] = tc.deploy_path
        result["spe"]  = tc.sepa

    except Exception,e:
        traceback.print_exc()
        result["status"] = "fail"
        result["result"] = str(e)      
    return HttpResponse(json.dumps(result))

def delete_conf(request):
    '''
    删除配置文件的信息
    '''
    result = {"status": "ok"}
    try:
        id = request.POST.get("id","_None").split("_")[1]

        tc = template_configure.objects.get(id=id)

        c = configure.objects.filter(template_configure_id=tc)

        for item in c:
            role_conf_item.objects.filter(configure_item=item).delete()

        c.delete()

        tc.delete()
        #文件暂时不删了，保存个备份
    except Exception,e:
        traceback.print_exc()
        result["status"] = "fail"
        result["result"] = str(e)      
    return HttpResponse(json.dumps(result))

def modify_configure_info(request):
    '''
    修改配置文件的信息
    '''
    id = request.POST.get("id",None)
    name = request.POST.get("name",None)
    path = request.POST.get("path",None)
    sep = request.POST.get("sep",None)
    result = {"status": "ok"}
    
    try:
        id = request.POST.get("id","_None").split("_")[1]

        tc = template_configure.objects.get(id=id)
        tc.name = name
        tc.deploy_path = path
        tc.sepa  = sep
        tc.save()

        __refresh_conf([tc])

    except Exception,e:
        traceback.print_exc()
        result["status"] = "fail"
        result["result"] = str(e)      
    return HttpResponse(json.dumps(result))