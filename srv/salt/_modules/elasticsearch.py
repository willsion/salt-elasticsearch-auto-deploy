#coding=utf-8
import subprocess,re
import os
import logging,traceback

log = logging.getLogger(__name__)

def runningprocess():
    '''get the running processinfo of elasticsearch'''
    cmd = r"ps -ef|grep elasticsearch|grep -v grep"
    child_stdout = os.popen(cmd)
    return child_stdout.read().strip()

def runningpid():
    '''get the running pid of elasticsearch'''
    cmd = r"ps -ef|grep elasticsearch|grep -v grep|awk '{print $2'}"
    child_stdout = os.popen(cmd)
    return child_stdout.read().strip()
    #r = subprocess.check_output(r"ps -ef|grep elasticsearch|grep -v grep|awk '{print $2'}", shell=True).strip()
    #return r

def status(*args,**kwarg):
    
    try:
        info = runningprocess()
        pid = runningpid()
        ret = {"info":"%s" % info , "running in pid":" %s" % pid , "flag":True}
    except:
        ret = {"info":"can't get the elasticsearch process info or nor running","flag":False}

    return ret

def start(*args,**kwarg):

    #先判断进程是否在运行，如果在运行，则不再 启动,基于 每台机器上只有一个进程 这个设定   
    try:
        result = os.popen("/etc/init.d/elasticsearch start").read()
    except:
        log.error(
            'es start fail {0} '.format(traceback.format_exc())
        )

    return result 

def stop(*args,**kwarg):
    
    try:
        result = os.popen("/etc/init.d/elasticsearch stop").read()
    except:
        log.error(
            'es stop fail {0} '.format(traceback.format_exc())
        )

    return result 

def restart(*args,**kwarg):
    try:
        result = os.popen("/etc/init.d/elasticsearch restart").read()
    except:
        log.error(
            'es restart fail {0} '.format(traceback.format_exc())
        )

    return result
