// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/DateUtil",
   "cloudera/chart/TimeBrowserState",
   "cloudera/chart/TimeBrowserServerState",
   "cloudera/chart/TimeRange",
   "cloudera/common/TimeUtil"
], function(Util, DateUtil, TimeBrowserState, TimeBrowserServerState, TimeRange, TimeUtil) {
  var oldServerTimezoneOffset = TimeUtil.getServerTimezoneOffset();
  var containerWidth = 2009;

  describe("TimeBrowserState Tests", function() {
    var state, options1 = {
      firstDate: new Date(910),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(950),
      lastVisibleDate: new Date(1000),
      markerDate: new Date(1000),
      isCurrentMode: true
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1050));
      state = new TimeBrowserState(options1);
      state.getContainerWidth = function() {
        return containerWidth;
      };
    });

    afterEach(function() {
    });


    it("should select a range.", function() {
      state.setSelectedRange(new TimeRange(new Date(940), new Date(960)));

      expect(state.firstDate.getTime()).toEqual(910);
      expect(state.lastDate.getTime()).toEqual(1000);
      expect(state.firstVisibleDate.getTime()).toEqual(940);
      expect(state.lastVisibleDate.getTime()).toEqual(960);
    });

    it("should select a range but not in the future.", function() {
      state.setSelectedRange(new TimeRange(new Date(950), new Date(1070)));

      expect(state.firstDate.getTime()).toEqual(910);
      expect(state.lastDate.getTime()).toEqual(1000);
      expect(state.firstVisibleDate.getTime()).toEqual(930);
      expect(state.lastVisibleDate.getTime()).toEqual(1050);
    });

    it("should select a range even if the input is reversed.", function() {
      state.setSelectedRange(new TimeRange(new Date(1020), new Date(950)));

      expect(state.firstDate.getTime()).toEqual(910);
      expect(state.lastDate.getTime()).toEqual(1000);
      expect(state.firstVisibleDate.getTime()).toEqual(950);
      expect(state.lastVisibleDate.getTime()).toEqual(1020);
    });

    it("should zoomOut in the present.", function() {
      state.zoomOut();

      // previous state is [910, 1000),
      // in the present mode, we hug the right hand side.
      expect(state.firstDate.getTime()).toEqual(865);
      expect(state.lastDate.getTime()).toEqual(1045);
      // actual selection not changed.
      expect(state.firstVisibleDate.getTime()).toEqual(950);
      expect(state.lastVisibleDate.getTime()).toEqual(1000);
    });

    it("should zoom in.", function() {
      state.zoomIn();

      // previous state is [910, 1000),
      // we are in current mode, so hug right.
      // the new state is
      // [1000 - (1000 - 910) / 2, 1000),
      // but since the new range doesn't quite
      // cover the original selection,
      // it is expanded back to [950, 1000)
      expect(state.firstDate.getTime()).toEqual(950);
      expect(state.lastDate.getTime()).toEqual(1000);
      expect(state.firstVisibleDate.getTime()).toEqual(950);
      expect(state.lastVisibleDate.getTime()).toEqual(1000);
    });

    it('should have param indicating that time change is because of auto update', function() {
      spyOn(state, 'publishTimeSelectionChanged');

      state.moveToNow(100101, true);
      expect(state.publishTimeSelectionChanged).wasCalledWith(true);
    });

    it("should test hasTimeControlParameters with startTime and endTime", function() {
      spyOn(state, "getURLParams").andReturn("startTime=1&endTime=2");
      expect(state.hasTimeControlParameters()).toBeTruthy();
    });

    it("should test hasTimeControlParameters with markerTime only", function() {
      spyOn(state, "getURLParams").andReturn("markerTime=1");
      expect(state.hasTimeControlParameters()).toBeTruthy();
    });

    it("should test hasTimeControlParameters with no relevant input parameters", function() {
      spyOn(state, "getURLParams").andReturn("foo=bar");
      expect(state.hasTimeControlParameters()).toBeFalsy();
    });

    it("should test setFromServerState in currentMode", function() {
      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "true"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(600);
      expect(+state.lastDate).toEqual(1000);
      expect(+state.firstVisibleDate).toEqual(900);
      expect(+state.lastVisibleDate).toEqual(1000);
      expect(+state.markerDate).toEqual(1000);
      expect(state.getCurrentMode()).toBeTruthy();
    });

    it("should test setFromServerState does nothing in TIMEONLY mode.", function() {
      state.mode = "TIMEONLY";
      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "true"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(600);
      expect(+state.lastDate).toEqual(1000);
      expect(+state.firstVisibleDate).toEqual(900);
      expect(+state.lastVisibleDate).toEqual(1000);
      expect(+state.markerDate).toEqual(1000);
      expect(state.getCurrentMode()).toBeTruthy();

    });

    it("should test setFromServerState with currentMode = true in the current mode", function() {
      state.setCurrentMode(true);

      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "true"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(600);
      expect(+state.lastDate).toEqual(1000);
      expect(+state.firstVisibleDate).toEqual(900);
      expect(+state.lastVisibleDate).toEqual(1000);
      // Note that we are not calling TimeUtil.getServerNow() here.
      expect(+state.markerDate).toEqual(1000);
      expect(state.getCurrentMode()).toBeTruthy();
    });

    it("should test setFromServerState with currentMode = true in the historical mode", function() {
      state.setCurrentMode(false);

      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "true"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(650);
      expect(+state.lastDate).toEqual(1050);
      expect(+state.firstVisibleDate).toEqual(950);
      expect(+state.lastVisibleDate).toEqual(1050);
      // Note that we are calling TimeUtil.getServerNow() here.
      expect(+state.markerDate).toEqual(1050);
      expect(state.getCurrentMode()).toBeTruthy();
    });


    it("should test setFromServerState with new currentMode = false in the current mode", function() {
      state.setCurrentMode(true);

      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "false"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(100);
      expect(+state.lastDate).toEqual(500);
      expect(+state.firstVisibleDate).toEqual(400);
      expect(+state.lastVisibleDate).toEqual(500);
      expect(+state.markerDate).toEqual(500);
      expect(state.getCurrentMode()).toBeFalsy();
    });

    it("should test setFromServerState with new currentMode = false in the historical mode", function() {
      state.setCurrentMode(false);

      var serverState = new TimeBrowserServerState();
      serverState.fromParams({
        firstTime: "100",
        lastTime: "500",
        startTime: "400",
        endTime: "500",
        markerTime: "500",
        currentMode: "false"
      });
      state.setFromServerState(serverState);
      expect(+state.firstDate).toEqual(100);
      expect(+state.lastDate).toEqual(500);
      expect(+state.firstVisibleDate).toEqual(400);
      expect(+state.lastVisibleDate).toEqual(500);
      expect(+state.markerDate).toEqual(500);
      expect(state.getCurrentMode()).toBeFalsy();
    });
  });

  describe("TimeBrowserState Tests with options2", function() {
    var state, options2 = {
      firstDate: new Date(810),
      lastDate: new Date(900),
      firstVisibleDate: new Date(850),
      lastVisibleDate: new Date(900),
      markerDate: new Date(900),
      isCurrentMode: false
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
      state = new TimeBrowserState(options2);
      state.getContainerWidth = function() {
        return containerWidth;
      };
    });

    afterEach(function() {
    });

    it("should zoomOut while in the past.", function() {
      state.zoomOut();

      // before we were on [810, 900)
      // zoomOut finds the midpoint = 855
      // the new range is [855 - 90, 855 + 90)
      expect(state.firstDate.getTime()).toEqual(765);
      expect(state.lastDate.getTime()).toEqual(945);
      // actual selection not changed.
      expect(state.firstVisibleDate.getTime()).toEqual(850);
      expect(state.lastVisibleDate.getTime()).toEqual(900);
    });

    it("should zoomOut with a past end point, but in current mode.", function() {
      state.setCurrentMode(true);
      state.zoomOut();

      // before the total range on [810, 900)
      // zoomOut doesn't care if the end date is older than the current
      // value.
      // the new range is [855 - 90, 855 + 90)
      expect(state.firstDate.getTime()).toEqual(765);
      expect(state.lastDate.getTime()).toEqual(945);

      // actual selection should not be changed.
      expect(state.firstVisibleDate.getTime()).toEqual(850);
      expect(state.lastVisibleDate.getTime()).toEqual(900);
    });
  });

  describe("TimeBrowserState with options3", function() {
    var id = "tc_timeControl";
    var state, options3 = {
      firstDate: new Date(900),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(950),
      lastVisibleDate: new Date(1000),
      isCurrentMode: true,
      markerDate: new Date(975),
      markerContainer: "#" + id
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
      TimeUtil.setServerTimezoneOffset(0);
      state = new TimeBrowserState(options3);
      state.getContainerWidth = function() {
        return containerWidth;
      };
    });

    afterEach(function() {
      $(options3.markerContainer).remove();

      TimeUtil.setServerTimezoneOffset(oldServerTimezoneOffset);
    });

    var matchTimeToOffset = function(time, expected) {
      expect(state.getOffsetFromDate(new Date(time))).toEqual(expected);
    };

    it("TimeBrowserState - offset calculation - time too old ", function() {
      var time = 500;
      var expected = 0;
      matchTimeToOffset(time, expected);
    });

    it("TimeBrowserState - offset calculation - start time", function() {
      var time = 900;
      var expected = 0;
      matchTimeToOffset(time, expected);
    });

    it("TimeBrowserState - offset calculation - end time", function() {
      var time = 1000;
      var expected = state.getMaximumOffset();
      matchTimeToOffset(time, expected);
    });

    it("TimeBrowserState - offset calculation - future time", function() {
      var time = 2000;
      var expected = state.getMaximumOffset();
      matchTimeToOffset(time, expected);
    });

    it("TimeBrowserState - offset calculation - quarter position", function() {
      var time = 925;
      var expected = state.getMaximumOffset() / 4;
      matchTimeToOffset(time, expected);
    });

    it("TimeBrowserState - offset calculation - half way position", function() {
      var time = 950;
      var expected = state.getMaximumOffset() / 2;
      matchTimeToOffset(time, expected);
    });

    var matchOffsetToTime = function(offset, expected) {
      expect(state.getDateFromOffset(offset).getTime()).toEqual(expected);
    };

    it("TimeBrowserState - date calculation - time too old ", function() {
      var offset = -20;
      var expected = 900;
      matchOffsetToTime(offset, expected);
    });

    it("TimeBrowserState - date calculation - start time", function() {
      var offset = 0;
      var expected = 900;
      matchOffsetToTime(offset, expected);
    });

    it("TimeBrowserState - date calculation - end time", function() {
      var offset = state.getMaximumOffset();
      var expected = 1000;
      matchOffsetToTime(offset, expected);
    });

    it("TimeBrowserState - date calculation - future time", function() {
      var offset = state.getMaximumOffset();
      var expected = 1000;
      matchOffsetToTime(offset, expected);
    });

    it("TimeBrowserState - date calculation - quarter position", function() {
      var offset = state.getMaximumOffset() / 4;
      var expected = 925;
      matchOffsetToTime(offset, expected);
    });

    it("TimeBrowserState - date calculation - half way position", function() {
      var offset = state.getMaximumOffset() / 2;
      var expected = 950;
      matchOffsetToTime(offset, expected);
    });
  });

  describe("TimeBrowserState Tests for different zoomIn cases", function() {

    var state1, state2, state3, options1 = {
      firstDate: new Date(910),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(910),
      lastVisibleDate: new Date(920),
      markerDate: new Date(915),
      isCurrentMode: false
    }, options2 = {
      firstDate: new Date(910),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(960),
      lastVisibleDate: new Date(980),
      markerDate: new Date(970),
      isCurrentMode: false
    }, options3 = {
      firstDate: new Date(900),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(940),
      lastVisibleDate: new Date(960),
      markerDate: new Date(950),
      isCurrentMode: false
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
      state1 = new TimeBrowserState(options1);
      state2 = new TimeBrowserState(options2);
      state3 = new TimeBrowserState(options3);
      state1.getContainerWidth = function() {
        return containerWidth;
      };
      state2.getContainerWidth = function() {
        return containerWidth;
      };
      state3.getContainerWidth = function() {
        return containerWidth;
      };
    });

    afterEach(function() {
    });

    it("should zoom in for state1.", function() {
      state1.zoomIn();

      expect(state1.firstDate.getTime()).toEqual(910);
      expect(state1.lastDate.getTime()).toEqual(955);
      expect(state1.firstVisibleDate.getTime()).toEqual(910);
      expect(state1.lastVisibleDate.getTime()).toEqual(920);
    });

    it("should zoom in for state2.", function() {
      state2.zoomIn();

      expect(state2.firstDate.getTime()).toEqual(955);
      expect(state2.lastDate.getTime()).toEqual(1000);
      expect(state2.firstVisibleDate.getTime()).toEqual(960);
      expect(state2.lastVisibleDate.getTime()).toEqual(980);
    });

    it("should zoom in for state3.", function() {
      state3.zoomIn();

      expect(state3.firstDate.getTime()).toEqual(925);
      expect(state3.lastDate.getTime()).toEqual(975);
      expect(state3.firstVisibleDate.getTime()).toEqual(940);
      expect(state3.lastVisibleDate.getTime()).toEqual(960);
    });
  });

  describe("TimeBrowserState Tests for moveSelection ", function() {

    var state, options = {
      firstDate: new Date(900),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(910),
      lastVisibleDate: new Date(920),
      markerDate: new Date(915),
      isCurrentMode: false
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(1000));
      state = new TimeBrowserState(options);
      state.getContainerWidth = function() {
        return containerWidth;
      };
    });

    afterEach(function() {
    });

    it("should move selected range forward to include marker", function() {
      state.setMarkerDate(new Date(930));
      state.moveSelectedRangeToIncludeMarker();

      expect(state.firstVisibleDate.getTime()).toEqual(925);
      expect(state.lastVisibleDate.getTime()).toEqual(935);
    });

    it("should move selected range back to include marker", function() {
      state.setMarkerDate(new Date(909));
      state.moveSelectedRangeToIncludeMarker();

      expect(state.firstVisibleDate.getTime()).toEqual(904);
      expect(state.lastVisibleDate.getTime()).toEqual(914);
    });

    it("should move selected range forward/back and maintain the duration", function() {
      state.setMarkerDate(new Date(909));
      state.moveSelectedRangeToIncludeMarker();

      state.selectNextRange();
      expect(state.firstVisibleDate.getTime()).toEqual(914);
      expect(state.lastVisibleDate.getTime()).toEqual(924);

      state.selectPreviousRange();
      expect(state.firstVisibleDate.getTime()).toEqual(904);
      expect(state.lastVisibleDate.getTime()).toEqual(914);
    });
  });
});
