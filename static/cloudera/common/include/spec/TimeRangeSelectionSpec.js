// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/include/TimeRangeSelection',
  'cloudera/chart/TimeRange'
], function(TimeRangeSelection, TimeRange) {
  describe("TimeRangeSelection Tests", function() {
    var id = "timeRangeSelection", module, $container;

    beforeEach(function() {
      $container = $("<div>").attr("id", id).appendTo(document.body);
      $("<a>").attr("href", "#").attr("data-minutes", 40).appendTo($container);
      $("<a>").attr("href", "#").attr("data-minutes", 80).appendTo($container);
      module = new TimeRangeSelection({
        container: "#" + id
      });
    });

    afterEach(function() {
      module.unsubscribe();
      $("#" + id).remove();
    });

    it("should publish setTimeRangeSelection event", function() {
      spyOn($, "publish");
      $container.find("a[data-minutes=40]").trigger("click");
      expect($.publish).wasCalled();
      var args = $.publish.mostRecentCall.args;
      expect(args[0]).toEqual("setTimeRangeSelection");
      expect(args[1][0]).toEqual(40 * 60 * 1000);
    });

    function testTimeSelectionChanged(minutes) {
      $.publish("timeSelectionChanged", [new TimeRange(new Date(1), new Date(1 + minutes * 60 * 1000))]);
      expect($container.find("a[data-minutes='" + minutes + "']").hasClass("bold")).toBeTruthy();
      expect($container.find("a[data-minutes!='" + minutes + "']").hasClass("bold")).toBeFalsy();
    }

    it("should subscribe timeSelectionChanged event", function() {
      testTimeSelectionChanged(40);
      testTimeSelectionChanged(80);
    });
  });
});
