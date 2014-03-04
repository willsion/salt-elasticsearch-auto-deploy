// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/chart/TimeBrowserState",
  "cloudera/chart/TimeBrowserRangeMarker"
], function(Util, TimeBrowserState, TimeBrowserRangeMarker) {

  describe("TimeBrowserRangeMarker tests", function() {
    var module, state, stateOptions = {
      firstDate: new Date(900),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(950),
      lastVisibleDate: new Date(1000),
      isCurrentMode: false,
      markerDate: new Date(975),
      markerContainer: "#cmsTimeControl"
    }, options = {
      id: "cmsTimeControl",
      showRange: true,
      mode: "INTERACTIVE"
    };

    // Covers 2000 pixels. Add 9 pixels because of the marker's right side width.
    var containerWidth = 2009;
    var buildDOM = function() {
      var id = options.id;
      var $container = $("<div>").attr("id", id)
        .css("position", "absolute")
        .css("width", containerWidth + "px")
        .css("height", "40px");

      var  $leftMask = $("<div>").addClass("left").css("position", "absolute").css("height", "40px");
      var  $rightMask = $("<div>").addClass("right").css("position", "absolute").css("height", "40px");
      var  $totalMask = $("<div>").addClass("mask").css("position", "absolute").css("height", "40px");

      $container.append($leftMask);
      $container.append($rightMask);
      $container.append($totalMask);
      return $container;
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      buildDOM().appendTo(document.body);
      state = new TimeBrowserState(stateOptions);
    });

    afterEach(function() {
      $("#" + options.id).remove();
      module.unsubscribe();
    });

    it("should refresh", function() {
      module = new TimeBrowserRangeMarker(options, state);
      spyOn(module, "refresh");
      module.onWindowResized();
      expect(module.refresh).wasCalledWith();
    });

    it("should move the left mask rectangle", function() {
      module = new TimeBrowserRangeMarker(options, state);
      // The overall time range is 900-1000.
      // The overall pixel range is 0-2000.

      // 500 from the left hand side is 1/4,
      // which is 925 in the time range.
      module.$leftMask.css("left", 0);
      module.$leftMask.width(500);

      // 0 from the right hand side is
      // simply 1000 in the time range.
      module.$rightMask.css("left", 2000);
      module.$rightMask.width(0);

      spyOn(module, "setSelectedRange").andCallThrough();
      module.onLeftResizeStop();
      expect(module.setSelectedRange).wasCalledWith(new Date(925), new Date(1000));
    });

    it("should move the right mask rectangle", function() {
      module = new TimeBrowserRangeMarker(options, state);
      // The overall time range is 900-1000.
      // The overall pixel range is 0-2000.

      // 1000 from the left hand side is 1/2,
      // which is 950 in the time range.
      module.$leftMask.css("left", 0);
      module.$leftMask.width(1000);

      // 500 from the right hande is 1/4, which is 975 in the time range.
      module.$rightMask.css("left", 1500);
      module.$rightMask.width(500);

      spyOn(module, "setSelectedRange").andCallThrough();
      module.onRightResizeStop();
      expect(module.setSelectedRange).wasCalledWith(new Date(950), new Date(975));
    });

    it("should not allow dragging in READONLY mode", function() {
      var newOptions = $.extend({}, options, {
        mode: "READONLY"
      });
      module = new TimeBrowserRangeMarker(newOptions, state);
      expect(module.$leftMask.is(":visible")).toBeTruthy();
      expect(module.$rightMask.is(":visible")).toBeTruthy();
    });
  });
});
