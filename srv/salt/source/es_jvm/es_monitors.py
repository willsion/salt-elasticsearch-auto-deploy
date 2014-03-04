#!/usr/bin/env python2.6

'''
monitors ES status
'''

import os,re
import sys
import subprocess
import json
import socket
import fcntl
import struct
import urllib2
import logging

class ES(object):
    
    def __init__(self):

        try:
            result = os.popen("ifconfig","r").read()
            ip = re.findall(r"inet addr:([^ ]+)",result)
            for item in ip:
                if not item.startswith("127") and not item.startswith("255"):
                    self.ip = item
                    break

        except:
            self.ip = "0.0.0.0"

    def get_data(self,req=""):

        self.cmd = 'curl -s "http://%s:9200/_nodes/%s/stats/%s"' % (sys.argv[2],self.ip,req)
        p = subprocess.Popen(self.cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,shell=True)
        f = p.stdout
        data = json.load(f)

        return data

    def get_es_FD(self):

        try:
            fd_max = 64000
            opt = "process"
            data = self.get_data(opt)
            fd = 0
            for i in data["nodes"].values():
                v = i[u'process']
                try:
                    fd = v["open_file_descriptors"]
                    break
                except:
                    continue

            if fd == 0:
                print 0
            else:
                print fd
                #print round((float(fd) / fd_max),2)
        except Exception,e:
            print "err"

    def get_es_index(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/index_last_data")
            total_time_last,total_last = map(int,open(r"/usr/local/zabbix/external-script/index_last_data",'r').read().split())

        except:
            total_time_last,total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            index_time_current,index_total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']["indexing"]
                try:
                    index_time_in_millis = v["index_time_in_millis"]
                    index_total          = v["index_total"]
                    index_time_current = index_time_in_millis - total_time_last
                    index_total_current = index_total - total_last
                    break
                except:
                    continue

            if index_total_current <= 0 or index_total_current <= 0:
                print 0
            else:
                print round((float(index_time_current) / index_total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/index_last_data","w")
            print >> f, ' '.join((map(str,(index_time_in_millis,index_total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()


    def get_es_query(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/query_last_data")
            total_time_last,total_last = map(int,open(r"/usr/local/zabbix/external-script/query_last_data",'r').read().split())

        except:
            total_time_last,total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            query_time_current,query_total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']["search"]
                try:
                    query_time_in_millis = v["query_time_in_millis"]
                    query_total = v["query_total"]
                    query_time_current = query_time_in_millis - total_time_last
                    query_total_current = query_total - total_last
                    break
                except:
                    continue

            if query_total_current <= 0 or query_time_current <= 0:
                print 0
            else:
                print round((float(query_time_current) / query_total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/query_last_data","w")
            print >> f, ' '.join((map(str,( query_time_in_millis,query_total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()

    def get_es_fetch(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/fetch_last_data")
            total_time_last,total_last = map(int,open(r"/usr/local/zabbix/external-script/fetch_last_data",'r').read().split())

        except:
            total_time_last,total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            fetch_time_current,fetch_total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']["search"]
                try:
                    fetch_time_in_millis = v["fetch_time_in_millis"]
                    fetch_total          = v["fetch_total"]
                    fetch_time_current = fetch_time_in_millis - total_time_last
                    fetch_total_current = fetch_total - total_last
                    break
                except:
                    continue

            if fetch_total_current <= 0 or fetch_time_current <= 0:
                print 0
            else:
                print round((float(fetch_time_current) / fetch_total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/fetch_last_data","w")
            print >> f, ' '.join((map(str,(fetch_time_in_millis,fetch_total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()

    def get_es_refresh(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/refresh_last_data")
            total_time_last,total_last = map(int,open(r"/usr/local/zabbix/external-script/refresh_last_data",'r').read().split())

        except:
            total_time_last,total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            total_time_current,total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']["refresh"]
                try:
                    total_time_in_millis = v["index_time_millis"]
                    total          = v["total"]
                    total_time_current = total_time_in_millis - total_time_last
                    total_current = total - total_last
                    break
                except:
                    continue

            if total_current <= 0 or total_time_current <= 0:
                print 0
            else:
                print round((float(total_time_current) / total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/refresh_last_data","w")
            print >> f, ' '.join((map(str,(total_time_in_millis,total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()

    def get_es_flush(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/flush_last_data")
            total_time_last,total_last = map(int,open(r"/usr/local/zabbix/external-script/flush_last_data",'r').read().split())

        except:
            total_time_last,total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            total_time_current,total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']["flush"]
                try:
                    total_time_in_millis = v["total_time_in_millis"]
                    total                = v["total"]
                    total_time_current = total_time_in_millis - total_time_last
                    total_current = total - total_last
                    break
                except:
                    continue

            if total_current <= 0 or total_time_current <= 0:
                print 0
            else:
                print round((float(total_time_current) / total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/flush_last_data","w")
            print >> f, ' '.join((map(str,( total_time_in_millis,total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()

    def get_es_FE(self):
        
        try:
            self.touch_file("/usr/local/zabbix/external-script/FE_last_data")
            eviction_last,query_total_last = map(int,open(r"/usr/local/zabbix/external-script/FE_last_data",'r').read().split())

        except:
            eviction_last,query_total_last = 0,0
        
        try:
            opt = "indices"
            data = self.get_data(opt)
            eviction_current,index_total_current = 0,0

            for i in data["nodes"].values():
                v = i[u'indices']
                try:
                    eviction    = v["filter_cache"]["evictions"]
                    query_total = v["search"]["query_total"]
                    eviction_current = eviction - eviction_last
                    query_total_current = query_total - query_total_last
                    break
                except:
                    continue

            if query_total_current <= 0 or eviction_current <= 0:
                print 0
            else:
                print round((float(eviction_current) / query_total_current / 60),2)

        except Exception,e:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/FE_last_data","w")
            print >> f, ' '.join((map(str,(eviction,query_total))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()
    
    def heap_used(self):
        
        try:
            opt = "jvm"
            data = self.get_data(opt)

            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    v = v["mem"]
                    heap_used_in_bytes = v["heap_used_in_bytes"]
                    heap_committed_in_bytes = v["heap_committed_in_bytes"]
                    break
                except:
                    continue

            if heap_used_in_bytes == 0 or heap_committed_in_bytes == 0:
                print 0
            else:
                print round((float(heap_used_in_bytes) / heap_committed_in_bytes),2)

        except:
            print "err"

    def frequency(self):

        try:
            self.touch_file("/usr/local/zabbix/external-script/frequency_last_data")
            collection_count_last = int(open(r"/usr/local/zabbix/external-script/frequency_last_data",'r').read().strip())
        except:
             collection_count_last = 0

        try:

            opt = "jvm"
            data = self.get_data(opt)
            collection_count = 0
            
            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    uptime_in_millis = v["uptime_in_millis"]
                    collection_count_current = v["gc"]["collectors"]["ConcurrentMarkSweep"]["collection_count"]
                    collection_count         = collection_count_current - collection_count_last
                    break
                except:
                    continue
            
            if collection_count <= 0:
                print 0
            else:
                 print round((float(uptime_in_millis) / collection_count / 1000),2)

        except:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/frequency_last_data","w")
            print >> f, str(collection_count_current)
        except:
            print >> f, "0"
        finally:
            f.close()

    def duration(self):

        try:
            self.touch_file("/usr/local/zabbix/external-script/duration_last_data")
            collection_time_last,collection_count_last =int(open(r"/usr/local/zabbix/external-script/duration_last_data",'r').read().strip())
        except:
             collection_time_last,collection_count_last = 0,0

        try:

            opt = "jvm"
            data = self.get_data(opt)
            collection_time_current,collection_count_current = 0,0
            
            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    collection_time_in_millis = v["gc"]["collectors"]["ConcurrentMarkSweep"]["collection_time_in_millis"]
                    collection_count = v["gc"]["collectors"]["ConcurrnetMarkSweep"]["collection_count"]
                    collection_time_current  = collection_time_in_millis - collection_time_last
                    collection_count_current = collection_count - collection_count_last
                    break
                except:
                    continue
            
            if  collection_count_current <= 0:
                print 0
            else:
                 print round((float(collection_time_current) / collection_count_current),2)

        except:
            print "err"

        try:
            f = open("/usr/local/zabbix/external-script/duration_last_data","w")
            print >> ff, ' '.join((map(str,(collection_time_in_millis,collection_count))))
        except:
            print >> f, ' '.join(('0','0'))
        finally:
            f.close()

    def touch_file(self,name=""):
        try:
            if not os.path.isfile("%s" % name):
                os.system("touch %s" % name)
        except:
            print "err"

if __name__ == '__main__':
   
   es = ES()
   fun = getattr(es,sys.argv[1])
   fun()
