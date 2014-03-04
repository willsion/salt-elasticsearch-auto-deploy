// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/TimeControlledContent',
  'cloudera/chart/TimeRange',
  'underscore'
], function(TimeControlledContent, TimeRange, _) {
  describe("TimeControlledContent Tests", function() {
    var module, id = "timeControlledContent";
    var options1 = {
      urlParams: {
        startTime: 1,
        endTime: 2
      },
      isCurrentMode: true,
      url: "dontcare",
      containerSelector: "#" + id
    };
    var options2 = {
      urlParams: {
        timestamp: 1
      },
      isCurrentMode: true,
      url: "dontcare",
      containerSelector: "#" + id
    };
    var someTooltip = '<div class="showTooltip" title="Some Tooltip">Some Text</div>';
    var someStaticHtml = someTooltip + someTooltip;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $("<div>").attr("id", id).appendTo(document.body);
      spyOn($.fn, "tooltip").andCallThrough();
      spyOn($, "post").andCallThrough();
    });

    afterEach(function() {
      $("#" + id).remove();
      module.unsubscribe();
    });

    var testEvent = function(event, args, urlFragments) {
      $.publish(event, args);
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: someStaticHtml
      });

      _.each(urlFragments, function(urlFragment) {
        expect($.post.mostRecentCall.args[0]).toContain(urlFragment);
      });
    };

    it("should respond to timeSelectionChanged event in current mode", function() {
      module = new TimeControlledContent(options1);
      testEvent("timeSelectionChanged", [new TimeRange(new Date(10), new Date(20)), true],
                ["startTime=10", "endTime=20"]);
      expect($.fn.tooltip.callCount).toEqual(2);
    });

    it("should respond to timeSelectionChanged event in historical mode", function() {
      module = new TimeControlledContent(options1);
      testEvent("timeSelectionChanged", [new TimeRange(new Date(30), new Date(40)), false],
                ["startTime=30", "endTime=40"]);
      expect($.fn.tooltip.callCount).toEqual(2);
    });

    it("should respond to different timeSelectionChanged events", function() {
      module = new TimeControlledContent(options1);
      testEvent("timeSelectionChanged", [new TimeRange(new Date(180), new Date(190)), false],
                ["startTime=180", "endTime=190"]);
      testEvent("timeSelectionChanged", [new TimeRange(new Date(280), new Date(290)), false],
                ["startTime=280", "endTime=290"]);
      // 2 setup, 2 cleanup, 2 setup again
      expect($.fn.tooltip.callCount).toEqual(6);
    });

    it("should only respond to the same timeSelectionChanged event once", function() {
      module = new TimeControlledContent(options1);
      testEvent("timeSelectionChanged", [new TimeRange(new Date(80), new Date(90)), false],
                ["startTime=80", "endTime=90"]);
      // publish the same event.
      $.publish("timeSelectionChanged", [new TimeRange(new Date(80), new Date(90)), false]);
      // the # of tooltip calls should remain unchanged.
      expect($.fn.tooltip.callCount).toEqual(2);
    });

    it("should respond to markerDateChanged event in current mode", function() {
      module = new TimeControlledContent(options2);
      testEvent("markerDateChanged", [new Date(50), true],
                ["timestamp=50", "currentMode=true"]);
      expect($.fn.tooltip.callCount).toEqual(2);
    });

    it("should respond to markerDateChanged event in historical mode", function() {
      module = new TimeControlledContent(options2);
      testEvent("markerDateChanged", [new Date(60), false],
                ["timestamp=60", "currentMode=false"]);
      expect($.fn.tooltip.callCount).toEqual(2);
    });

    it("should respond to different markerDateChanged events", function() {
      module = new TimeControlledContent(options2);
      testEvent("markerDateChanged", [new Date(180), false],
                ["timestamp=180", "currentMode=false"]);
      testEvent("markerDateChanged", [new Date(280), false],
                ["timestamp=280", "currentMode=false"]);
      // 2 setup, 2 cleanup, 2 setup again
      expect($.fn.tooltip.callCount).toEqual(6);
    });

    it("should only respond to the same markerDateChanged event once", function() {
      module = new TimeControlledContent(options2);
      testEvent("markerDateChanged", [new Date(70), false],
                ["timestamp=70", "currentMode=false"]);
      // publish the same event.
      $.publish("markerDateChanged", [new Date(70), false]);
      // the # of tooltip calls should remain unchanged.
      expect($.fn.tooltip.callCount).toEqual(2);
    });

  });
});
