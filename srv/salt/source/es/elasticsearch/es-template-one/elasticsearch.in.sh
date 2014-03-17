ES_CLASSPATH=$ES_CLASSPATH:$ES_HOME/lib/elasticsearch-{{pillar['es-version']}}.jar:$ES_HOME/lib/*:$ES_HOME/lib/sigar/*
ES_HEAP_SIZE=4g
ES_MIN_MEM=$ES_HEAP_SIZE
ES_MAX_MEM=$ES_HEAP_SIZE
JAVA_OPTS="$JAVA_OPTS -Xms${ES_MIN_MEM}"
JAVA_OPTS="$JAVA_OPTS -Xmx${ES_MAX_MEM}"
if [ "x$ES_HEAP_NEWSIZE" != "x" ]; then
    JAVA_OPTS="$JAVA_OPTS -Xmn${ES_HEAP_NEWSIZE}"
fi
if [ "x$ES_DIRECT_SIZE" != "x" ]; then
    JAVA_OPTS="$JAVA_OPTS -XX:MaxDirectMemorySize=${ES_DIRECT_SIZE}"
fi
JAVA_OPTS="$JAVA_OPTS -Xss256k"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
if [ "x$ES_USE_IPV4" != "x" ]; then
  JAVA_OPTS="$JAVA_OPTS -Djava.net.preferIPv4Stack=true"
fi
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
JAVA_OPTS="$JAVA_OPTS -XX:MaxGCPauseMillis=200"
if [ "x$ES_USE_GC_LOGGING" != "x" ]; then
  JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCDetails"
  JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCTimeStamps"
  JAVA_OPTS="$JAVA_OPTS -XX:+PrintClassHistogram"
  JAVA_OPTS="$JAVA_OPTS -XX:+PrintTenuringDistribution"
  JAVA_OPTS="$JAVA_OPTS -XX:+PrintGCApplicationStoppedTime"
  JAVA_OPTS="$JAVA_OPTS -Xloggc:/var/log/elasticsearch/gc.log"
fi
JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError"
#relative_role={{pillar.1565|default('flag')}}
