// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/TimeUtil",
  "cloudera/chart/TimeBrowserState",
  "cloudera/chart/TimeBrowserMarker"
], function(Util, Humanize, TimeUtil, TimeBrowserState, TimeBrowserMarker) {

  var containerWidth = 2009;
  var buildDOM = function(id) {
    var $container = $("<div>")
    .attr("id", id + "_timeControl")
    .attr("position", "absolute")
    .css("width", containerWidth + "px")
    .css("height", "40px");

    var  $marker = $("<span>")
    .addClass("marker")
    .addClass("draggable");

    $container.append($marker);
    return $container;
  };

  var getMarkerElem = function() {
    return $(".marker");
  };

  describe("TimeBrowserMarker Tests with options1", function() {

    var state, marker, options1 = {
      firstDate: new Date(900),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(950),
      lastVisibleDate: new Date(1000),
      isCurrentMode: false,
      markerDate: new Date(975),
      markerSelector: ".marker",
      markerContainer: "#tc_timeControl",
      showMarker: true,
      mode: "INTERACTIVE"
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, 'getServerTimezoneOffset').andReturn(0);
      // The now state is a bit in the future: 2000.
      spyOn(TimeUtil, 'getServerNow').andReturn(new Date(2000));
      // Set the timezone delta in Humanize as well.
      // Mimics the computation found in TimeUtil::setServerTimezoneOffset
      // if the test runner were in PST (-7).
      spyOn(TimeUtil, 'getTimezoneDelta').andReturn(25200000);

      $("body").append(buildDOM("tc"));
      state = new TimeBrowserState(options1);
      marker = new TimeBrowserMarker(options1, state);
    });

    afterEach(function() {
      $("#tc_timeControl").remove();
      if (marker) {
        marker.unsubscribe();
      }
    });

    describe("TimeBrowserMarker - General tests", function() {

      it("should initialize.", function() {
        expect(marker.isInteractive()).toBeTruthy();
        expect(state.getMaximumOffset()).toEqual(containerWidth - state.markerRightWidth);
      });

      it("should move the marker.", function() {
        marker.moveToOffset(1000);
        expect($(".marker").css("left")).toEqual("991px");
      });

      it("should animate the move of the marker", function() {
        marker.moveToOffset(1000, false);
        expect($(".marker:animated").length).toEqual(0);
        marker.moveToOffset(900, true);
        expect($(".marker:animated").length).toEqual(1);
      });

      it("should call the callback after the move is complete with animation", function() {
        marker.$markerSelector.animate = jasmine.createSpy('animate');
        var cb = jasmine.createSpy('cb');
        marker.moveToOffset(1000, true, cb);
        expect(marker.$markerSelector.animate).wasCalled();
        var args = marker.$markerSelector.animate.mostRecentCall.args;
        expect(args[2]).toEqual(cb);
      });

      it("should call the callback after move is complete with no animation", function() {
        var cb = jasmine.createSpy('cb');
        marker.moveToOffset(1000, false, cb);
        expect(cb).wasCalled();
      });

      it("should refresh the marker.", function() {
        marker.refresh();
        var expected = state.getMaximumOffset() * 3 / 4;
        expect($(".marker").css("left")).toEqual((expected - marker.markerLeftWidth) + "px");
      });

      it("should trigger drag event.", function() {
        spyOn(marker, 'onDrag').andCallThrough();
        spyOn(marker, 'onDragStop').andCallThrough();
        var $markerElem = getMarkerElem();

        $markerElem.css("left", 0);
        $markerElem.trigger("dragstart");

        $markerElem.css("left", 1000);
        $markerElem.trigger("drag");
        expect(marker.onDrag).toHaveBeenCalled();
        expect($markerElem.attr("title")).toEqual("11:00 PM");

        $markerElem.css("left", 500);
        $markerElem.trigger("dragstop");
        expect(marker.onDragStop).toHaveBeenCalled();
        expect(marker.state.markerDate.getTime()).toEqual(925);
      });
    });
  });
});
