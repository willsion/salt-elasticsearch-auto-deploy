// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([], function() {
  var getFilterValue = function(msSinceLastSeen) {
    var secondsSinceLastSeen = msSinceLastSeen / 1000;
    var filterValue = "";

    // Note:
    // When changing this class,
    // also change HeartbeatDuration.java
    if (secondsSinceLastSeen < 30) {
      filterValue = "0s-30s";
    } else if (secondsSinceLastSeen < 60) {
      filterValue = "30s-1m";
    } else if (secondsSinceLastSeen < 2 * 60) {
      filterValue = "1m-2m";
    } else if (secondsSinceLastSeen < 5 * 60) {
      filterValue = "2m-5m";
    } else if (secondsSinceLastSeen < 10 * 60) {
      filterValue = "5m-10m";
    } else {
      filterValue = "10m+";
    }

    return filterValue;
  };

  return {
    getFilterValue: getFilterValue
  };
});
