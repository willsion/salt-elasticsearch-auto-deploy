#coding=utf-8
import os,yaml,traceback
from elasticsearch import logger


host = "192.168.81.208"
port = "9090"
user = "op1"
password = 'tmhtrtubu5@uLJ7rw'
auth = "pam"



op_url = ''' \
    curl -k https://{0}:{1}/run --connect-timeout 1800       -m 20000 \
        -H 'Accept: application/x-yaml' \
        -d client='local' \
        -d tgt='{2}' \
        -d expr_form='list' \
        -d fun='{3}' \
        -d username='{4}' \
        -d password='{5}' \
        -d eauth='{6}' \
    '''


def web_request(target,fun,args,template,name):

    if target == "master":
        target = host

    os.environ["http_proxy"] = ""
    resquest_url = op_url.format(host,port,target,fun,user,password,auth).lstrip()
    if not args == []:
        args = [' -d  arg="{0}" '.format(x) for x in args]
        args = r' '.join(args)
        resquest_url += " " + args

    if not template == None:
        resquest_url += ' -d arg={0}  -d arg={1}'.format(template,name)
    elif not name == None:
        resquest_url += ' -d arg={0}  -d arg={1}'.format("no_template",name)

    print "==request url=====",resquest_url
    result = os.popen(resquest_url)
    try:
        result = yaml.load(result.read())["return"]
        return result
    except:
        logger.error("web_request " + traceback.format_exc())
        return None

