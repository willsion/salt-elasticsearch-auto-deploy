#!/usr/bin/env python2.6

'''
check the heap of JVM committed and used
curl -s URL get the json data
'''

import os,re
import sys
import subprocess
import json
import socket    
import fcntl    
import struct
import urllib2
  


class ES:   


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



    def get_data(self):

        self.cmd = 'curl -s "http://%s:9200/_nodes/%s/stats/jvm"' % (sys.argv[2],self.ip)

        p = subprocess.Popen(self.cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,shell=True)
        f = p.stdout
        data = json.load(f)
        return data

    def frequency(self):

        try:
            collection_count_last = int(open(r"/usr/local/zabbix/external-script/frequency_last_data",'r').read().strip())
        except:
            collection_count_last = 0


        try:
            data = self.get_data()

            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    #uptime_in_millis = v["uptime_in_millis"]
                    collection_count_current = v["gc"]["collectors"]["ConcurrentMarkSweep"]["collection_count"]
                    collection_count         = collection_count_current -  collection_count_last
                    break
                except:
                    continue

     
            if collection_count == 0:
                print 0
                return

            #print round((float(uptime_in_millis) / collection_count / 1000),2)
            print collection_count

        except:
            print "err"

        try:
            ff = open("/usr/local/zabbix/external-script/frequency_last_data","w")
            print >> ff, str(collection_count)
        except:
            print >> ff, "0"
        finally:
            ff.close()


    def duration(self):

        try:
            collection_time_last,collection_count_last = map(int,open(r"/usr/local/zabbix/external-script/duration_last_data",'r').read().split())
        except:
            collection_time_last,collection_count_last = 0,0

        try:

            data = self.get_data()

            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    collection_time_in_millis = v["gc"]["collectors"]["ConcurrentMarkSweep"]["collection_time_in_millis"]
                    collection_count = v["gc"]["collectors"]["ConcurrentMarkSweep"]["collection_count"]
                    collection_time_current  = collection_time_in_millis - collection_time_last
                    collection_count_current = collection_count - collection_count_last
                    break
                except:
                    continue

            if collection_count_current == 0:
                print 0
                return

            print round((float(collection_time_current) / collection_count_current),2)

        except:
            print "err"

        try:
            ff = open("/usr/local/zabbix/external-script/duration_last_data","w")
            print >> ff, ' '.join((map(str,(collection_time_in_millis,collection_count))))
        except:
            print >> ff, ' '.join(('0','0'))
        finally:
            ff.close()


    def heap_used(self):

        try:

            data = self.get_data()

            for i in data["nodes"].values():
                v = i[u'jvm']
                try:
                    v = v["mem"]
                    heap_used_in_bytes = v["heap_used_in_bytes"]

                    heap_committed_in_bytes = v["heap_committed_in_bytes"]
                    break
                except:
                    continue


            if heap_used_in_bytes == 0:
                print 0
                return

            print round((float(heap_used_in_bytes) / heap_committed_in_bytes),2)

        except:
            print "err"


    def get_data_urllib(self):
        try:
            url = "http://%s:9200/_cluster/health" % (sys.argv[2])
            response = urllib2.urlopen(url)
            data = json.loads(response.read())
        except urllib2.HTTPError:
            print "Error"
        
        return data

    def check_ES_health(self):      

        data = self.get_data_urllib()

        status = data["status"]

        if status == 'green':
            print 1.0
        elif status == 'yellow':
            print 0.5
        elif status == 'red':
            print 0.0



if __name__ == '__main__':
  
    es = ES()
    fun = getattr(es,sys.argv[1])
    fun()

