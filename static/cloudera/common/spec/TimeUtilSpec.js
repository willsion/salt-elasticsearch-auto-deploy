// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/TimeUtil'
], function(TimeUtil) {
  describe('TimeUtil', function() {
    var oldTZOffset;

    beforeEach(function() {
      oldTZOffset = TimeUtil.getServerTimezoneOffset();
    });

    afterEach(function() {
      TimeUtil.setServerTimezoneOffset(oldTZOffset);
    });


    it("expects a very old server date", function() {
      // set the server time to be something really old.
      TimeUtil.setServerNow(new Date(1));
      // after some short delay,
      var serverDate = TimeUtil.getServerNow();
      // expect the current server time to be something
      // really old as well.
      expect(serverDate.getTime()).toBeLessThan(1000);
    });

    it("should set/get the server timezone display name", function() {
      var oldDisplayName = TimeUtil.getTimezoneDisplayName();
      expect(TimeUtil.getTimezoneDisplayName()).toEqual(oldDisplayName);

      TimeUtil.setTimezoneDisplayName("blah");
      expect(TimeUtil.getTimezoneDisplayName()).toEqual("blah");

      TimeUtil.setTimezoneDisplayName(oldDisplayName);
    });

    it("should setServerTimezoneOffset only if the argument is numeric", function() {
      TimeUtil.setServerTimezoneOffset(10);
      expect(TimeUtil.getServerTimezoneOffset()).toEqual(10);
      TimeUtil.setServerTimezoneOffset("blah");
      expect(TimeUtil.getServerTimezoneOffset()).toEqual(10);
    });

    it("should return the current timezone in 8601 format", function() {
      TimeUtil.setServerTimezoneOffset(8);
      expect(TimeUtil.getServerIso8601Timezone()).toEqual('+0800');
      
      TimeUtil.setServerTimezoneOffset(-8);
      expect(TimeUtil.getServerIso8601Timezone()).toEqual('-0800');
      
      TimeUtil.setServerTimezoneOffset(0);
      expect(TimeUtil.getServerIso8601Timezone()).toEqual('Z');
    });

    it("should test timezone offset", function() {
      var MS_IN_ONE_MINUTE = 60 * 1000;
      var MS_IN_ONE_HOUR = 60 * MS_IN_ONE_MINUTE;

      TimeUtil.setServerTimezoneOffset(oldTZOffset - MS_IN_ONE_HOUR);
      var serverDate = new Date();
      var localDate = TimeUtil.fromServerDate(serverDate);
      expect(localDate.getTime() - serverDate.getTime()).toEqual(MS_IN_ONE_HOUR);

      var serverDate2 = TimeUtil.toServerDate(localDate);
      expect(serverDate2.getTime()).toEqual(serverDate.getTime());
      expect(localDate.getTime() - serverDate2.getTime()).toEqual(MS_IN_ONE_HOUR);
    });
  });
});
