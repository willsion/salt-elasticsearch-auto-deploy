// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/HeartbeatDuration"
], function(HeartbeatDuration) {

describe("HeartbeatDuration Tests", function() {
  var testGetFilterValue = function(msSinceLastSeen, expected) {
    var actual = HeartbeatDuration.getFilterValue(msSinceLastSeen);
    expect(actual).toEqual(expected);
  };

  it("should calculate the filterValue", function() {
    var msSinceLastSeen, expected;

    // 45000 (45s), 90000 (1min 30s) etc
    // are milliseconds into the past.
    testGetFilterValue(0, '0s-30s');
    testGetFilterValue(22500, '0s-30s');
    testGetFilterValue(45000, '30s-1m');
    testGetFilterValue(90000, '1m-2m');
    testGetFilterValue(180000, '2m-5m');
    testGetFilterValue(360000, '5m-10m');
    testGetFilterValue(720000, '10m+');
    testGetFilterValue(7200000, '10m+');
  });
});
});
