// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/TimeControlMini',
  'cloudera/chart/TimeBrowserState'
], function(TimeControlMini, TimeBrowserState) {
  describe("TimeControlMini Tests", function() {
    var id = "timeControlMini";
    var breadcrumbId = "mainBreadcrumb";
    var stateParams = {
      mode: "INTERACTIVE",
      showRange: true,
      showMarker: true,
      firstDate: new Date(1),
      lastDate: new Date(10),
      firstVisibleDate: new Date(5),
      lastVisibleDate: new Date(10),
      markerDate: new Date(7),
      isCurrentMode: false
    };
    var state = new TimeBrowserState(stateParams);
    var baseOptions = {
      container: "#" + id,
      breadcrumbContainer: "#" + breadcrumbId,
      showRange: true,
      state: state
    };
    var module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      $("<ul>").attr("id", breadcrumbId).addClass("breadcrumb").appendTo(document.body);
      $("#" + id).html('<a class="toggle-icon pull-right">x</a>' +
                       '<div class="pull-left">' +
                       '  <span>' +
                       '    <a href="#" class="time-label">Time Label</a>' +
                       '    <a href="#" class="switchToCurrent">Now</a>' +
                       '  </span>' +
                       '</div>');
      $("#" + breadcrumbId).html('<li>Breadcrumb1</li><li>Breadcrumb 2</li>').width(100 + "px");
    });

    afterEach(function() {
      $("#" + id).remove();
      $("#" + breadcrumbId).remove();
      module.unsubscribe();
    });

    it("should toggle the state", function() {
      module = new TimeControlMini(baseOptions);

      spyOn($, "publish");
      expect(module.toggleState()).toEqual(module.STATE_EXPANDED);
      module.toggle();
      expect(module.toggleState()).toEqual(module.STATE_COLLAPSED);

      expect($.publish).wasCalledWith(module.EVENT_TOGGLE_TIME_CONTROL);
    });

    it("should toggle visibility", function() {
      module = new TimeControlMini(baseOptions);

      module.showNow();
      expect(module.nowVisible()).toBeTruthy();

      module.hideNow();
      expect(module.nowVisible()).toBeFalsy();
    });

    it("should trigger the date time selector", function() {
      module = new TimeControlMini(baseOptions);

      spyOn($, "publish");
      module.showDateTimeSelector();
      expect($.publish).wasCalledWith(module.EVENT_SHOW_DATE_TIME_SELECTOR);
    });

    it("should trigger now", function() {
      module = new TimeControlMini(baseOptions);

      spyOn($, "publish");
      module.now();
      expect($.publish).wasCalledWith(module.EVENT_SWITCH_TO_CURRENT);
    });

    it("should test onRefresh", function() {
      module = new TimeControlMini(baseOptions);

      spyOn(module, "setTimeLabelOffsetAndPosition").andCallThrough();
      var leftMargin = module.getLeftMargin();
      var rightMargin = module.getRightMargin();

      module.onRefresh();

      expect(module.setTimeLabelOffsetAndPosition).wasCalled();
      var timeLabelOffsetLeft = module.setTimeLabelOffsetAndPosition.mostRecentCall.args[0];
      var timeLabelPosition = module.setTimeLabelOffsetAndPosition.mostRecentCall.args[1];
      expect(timeLabelOffsetLeft).toBeGreaterThan(leftMargin - 1);
      expect(timeLabelPosition).toEqual("absolute");
    });

    it("should test setTimeRangeSelection", function() {
      module = new TimeControlMini(baseOptions);

      spyOn(module.state, "setSelectedRange").andCallThrough();
      spyOn(module.state, "moveMarkerIntoSelectedRange").andCallThrough();

      $.publish(module.EVENT_SET_TIME_RANGE_SELECTION, [2]);

      expect(module.state.setSelectedRange).wasCalled();
      var timeRange = module.state.setSelectedRange.mostRecentCall.args[0];
      expect(timeRange.duration()).toEqual(2);
      expect(module.state.moveMarkerIntoSelectedRange).wasCalled();
    });
  });
});
