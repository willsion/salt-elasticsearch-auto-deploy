// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/chart/TimeRange",
   "cloudera/common/TimeUtil"
], function(Util, TimeRange, TimeUtil) {

  describe("TimeRange Tests", function() {
    var timeRange;

    beforeEach(function() {
      timeRange = new TimeRange(new Date(1), new Date(11));
    });

    it("should create a basic time range.", function() {
      expect(timeRange.startDate.getTime()).toEqual(1);
      expect(timeRange.endDate.getTime()).toEqual(11);
    });

    it("should create a basic time range when the end points are reversed.", function() {
      timeRange = new TimeRange(new Date(11), new Date(1));
      expect(timeRange.startDate.getTime()).toEqual(1);
      expect(timeRange.endDate.getTime()).toEqual(11);
    });

    it("should not equal to a null range.", function() {
      expect(timeRange.equals(null)).toEqual(false);
    });

    it("should equal to the same range.", function() {
      var other = new TimeRange(new Date(1), new Date(11));
      expect(timeRange.equals(other)).toEqual(true);
    });

    it("should not equal to a different range.", function() {
      var other = new TimeRange(new Date(2), new Date(11));
      expect(timeRange.equals(other)).toEqual(false);
    });

    it("should find the duration of a range.", function() {
      expect(timeRange.duration()).toEqual(10);
    });

    it("should find the midPoint of a range.", function() {
      expect(timeRange.midPoint().getTime()).toEqual(6);
    });

    it("should expand a range.", function() {
      timeRange = new TimeRange(new Date(1001), new Date(1011));
      timeRange.expand();
      var other = new TimeRange(new Date(996), new Date(1016));
      expect(timeRange.equals(other)).toBeTruthy();
    });

    it("should ensure a range is not in the future.", function() {
      // the new now date is 1010.
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1010));

      timeRange = new TimeRange(new Date(1001), new Date(1011));
      timeRange.ensureNotFuture();
      var other = new TimeRange(new Date(1000), new Date(1010));
      expect(timeRange.equals(other)).toEqual(true);
    });

    it("should not contain a null range.", function() {
      expect(timeRange.contains(null)).toEqual(false);
    });

    it("should contain the time range other.", function() {
      var other = new TimeRange(new Date(1), new Date(5));
      expect(timeRange.contains(other)).toEqual(true);
    });

    it("should not contain this range.", function() {
      var other = new TimeRange(new Date(5), new Date(13));
      expect(timeRange.contains(other)).toEqual(false);
    });

    it("should intersect the time range other.", function() {
      var other = new TimeRange(new Date(5), new Date(13));
      expect(timeRange.intersects(other)).toEqual(true);
    });

    it("should intersect the time range other.", function() {
      var other = new TimeRange(new Date(1), new Date(5));
      expect(timeRange.intersects(other)).toEqual(true);
    });

    it("should not intersect the time range other.", function() {
      var other = new TimeRange(new Date(12), new Date(13));
      expect(timeRange.intersects(other)).toEqual(false);
    });

  });
});
