#coding=utf-8
import salt.client

def __fetch_machine_info(target):
    if target == [] or not type(target) == list or type(target) == tuple:
        return {}
        
    return_data = {}
    for item in target:
        return_data[item] = {}
    local  = salt.client.LocalClient()
    '''
    result = local.cmd(target, "cmd.run",["hostname"],timeout=5,expr_form="list")
    for k,v in result.items():
        return_data[k]["host"] = v
    '''
    result = local.cmd(target, "grains.item",["ipv4"],timeout=50,expr_form="list")
    for k,v in result.items():
        for item in v["ipv4"]:
            if item.startswith("127.") or item.startswith("255."):
                continue
            else:
                #多网卡取第一个IP
                return_data[k]["IP"] = item
                break
    return return_data