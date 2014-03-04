#!/usr/bin/python2.6
#coding=utf-8
import os,re
import subprocess
import logging,traceback

log = logging.getLogger(__name__)


logstash_path = '/home/op1/app/logstash/'
logstash_jar = 'logstash-*-flatjar.jar'
logpath = '/var/log/logstash/'


def __fetch_conf__():
    array = []
    dirname = logstash_path + "/conf/"

    for item in os.listdir(dirname):
        if item.endswith(".conf"):
            array.append(item.strip())

    return array


def status(*args,**kwarg):

    if len(args) > 50:
        return {"err":"args is too long"}

    need_stop = {}
    for item in args:
        need_stop[item.strip()] = 0

    try:
        result = []
        output = os.popen("ps aux |grep logstash").readlines()
        for line in output:
            #默认是 -f在前 -l在后
            try:
                instance = re.findall(r"-f[ ]+.*?conf\/(.*?\.conf)(?:[ ]*-l[ ]+)?([^ \n]*)",line)
                if not instance == [] and not instance[0][0] == "":
                    #全要显示 或是出现在 需要显示的列表中
                    if args == () or instance[0][0] in need_stop:
                        result.append({"conf":instance[0][0],"log":instance[0][1]})
            except:
                log.error(
                    'get logstash status fail {0} '.format(traceback.format_exc())
                )
    except:
        log.error(
            'get logstash status fail {0} '.format(traceback.format_exc())
        )

    finally:
        args = __fetch_conf__()
        return {"instance_running":result,
                "exist-instance-conf":args}



def start(*args,**kwarg):
    '''
    start logstash using config file for app with apptype, and output log to log_file
    app is like pprobe or pprobe-offline
    apptype is index or shipper
    '''

    try:
        run_status = {}
        for item in status()["instance_running"]:
            run_status[item["conf"]] = 0 
    except:
        run_status = {}

    result = {}

    if args == [] or args == ():
        args = __fetch_conf__()

    os.chdir(logstash_path)
      
    for item in args:
        config_file = logstash_path + "conf/" + item
        log_path    = logpath + item + ".log"

        if os.path.isfile(config_file):
            if not  item in run_status:
                cmd = 'nohup java -jar %s%s agent -f %s -l %s &1>%s &2>%s &' % (logstash_path, logstash_jar, config_file,log_path,logpath+"/logstash.log",logpath+"/logstash.err")
                exit_status = os.system(cmd)
                result[item] = "ok" if exit_status == 0 else "wrong"
            else:
                result[item] = "already_run"
        else:
            result[item] = "not exist"

    return result


def stop(*args,**kwarg):
    result = {}

    os.chdir(logstash_path)

    '''
    检查现在正在跑的任务
    '''

    if len(args) > 50:
        return {"err":"args is too long"}

    need_stop = {}
    for item in args:
        need_stop[item.strip()] = 0

    result = {}

    try:
        output = os.popen("ps aux |grep logstash").readlines()  
        for line in output:
            instance = re.findall(r"^[^ ]+[ ]+([0-9]+).*?-f[ ]+.*?conf\/(.*?\.conf)",line)

            if not instance == [] and not instance[0][1] == "" and not instance[0][0] == "":
                #全都要杀 或是 出现在要杀的列表
                if args == () or instance[0][1] in need_stop:              
                    ret = os.system("kill -9  " + instance[0][0])
                    result[instance[0][1]] = "ok" if ret == 0 else "wrong"

    except:
        log.error(
            'get logstash status fail {0} '.format(traceback.format_exc())
        )

    finally:
        return result                    


   
    return result



def restart(*args,**kwarg):
    '''
    函数只是重启instance，
    不是先杀掉所有instance然后启动所有instance
    '''
    stop_result = stop(*args)
    need_start = []
    for k,v in stop_result.items():
        if v == "ok":
            need_start.append(k)
    start_result = start(*need_start)
    return {"stop_instance_status":stop_result,
            "restart_instance_status":start_result}





