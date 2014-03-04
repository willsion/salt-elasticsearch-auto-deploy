// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/chart/TimeLabelUpdater",
   "cloudera/chart/TimeRange",
   "cloudera/common/Humanize",
   "cloudera/common/TimeUtil"
], function(Util, TimeLabelUpdater, TimeRange, Humanize, TimeUtil) {

  describe("TimeLabelUpdater Tests", function() {

    var labelUpdater, oldTimezoneOffset = TimeUtil.getServerTimezoneOffset(),
    oldTimezoneDisplayName = TimeUtil.getTimezoneDisplayName(),
    MS_IN_ONE_HOUR = 60 * 60 * 1000;

    beforeEach(function() {
      labelUpdater = new TimeLabelUpdater();
      var $rangeLabel = $("<div>").addClass("selectedTimeRangeLabel");
      var $markerLabel = $("<div>").addClass("selectedTimeEndTimeLabel");
      $("body").append($rangeLabel).append($markerLabel);
      TimeUtil.setServerTimezoneOffset(0);
      TimeUtil.setTimezoneDisplayName("UTC");
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
      // Return a timezone delta of 7 hours.
      var timezoneDelta = 7 * 60 * 60 * 1000;
      spyOn(TimeUtil, "getTimezoneDelta").andReturn(timezoneDelta);
    });

    afterEach(function() {
      labelUpdater.unsubscribe();
      $(".selectedTimeRangeLabel").remove();
      $(".selectedTimeEndTimeLabel").remove();
      TimeUtil.setServerTimezoneOffset(oldTimezoneOffset);
      TimeUtil.setTimezoneDisplayName(oldTimezoneDisplayName);
    });

    it("should update the time selection label.", function() {
      var timeRange = new TimeRange(new Date(10 * MS_IN_ONE_HOUR), new Date(20 * MS_IN_ONE_HOUR));
      $.publish("timeSelectionChanged", [timeRange, true]);
      var actual = $(".selectedTimeRangeLabel").html();
      var expected = 'January 1 1970, 9:00:00 AM - 7:00:00 PM UTC';
      expect(actual).toEqual(expected);
    });

    it("should update the time selection label when the start/end date differ.", function() {
      var timeRange = new TimeRange(new Date(10 * MS_IN_ONE_HOUR), new Date(50 * MS_IN_ONE_HOUR));
      $.publish("timeSelectionChanged", [timeRange, false]);
      var actual = $(".selectedTimeRangeLabel").html();
      var expected = 'January 1 1970, 9:00:00 AM - January 3 1970, 1:00:00 AM UTC';
      expect(actual).toEqual(expected);
    });

    it("should update the time marker label.", function() {
      var markerDate = new Date(30 * MS_IN_ONE_HOUR);
      $.publish("markerDateChanged", [markerDate, false]);
      var actual = $(".selectedTimeEndTimeLabel").html();
      var expected = 'January 2 1970, 5:00:00 AM UTC';
      expect(actual).toEqual(expected);
    });

    it("should update the time marker label in current mode.", function() {
      var markerDate = new Date(30 * MS_IN_ONE_HOUR);
      $.publish("markerDateChanged", [markerDate, true]);
      var actual = $(".selectedTimeEndTimeLabel").html();
      var expected = 'January 2 1970, 5:00:00 AM UTC';
      expect(actual).toEqual(expected);
    });
  });
});
