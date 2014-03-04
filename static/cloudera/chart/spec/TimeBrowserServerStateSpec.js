// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/TimeUtil",
   "cloudera/chart/TimeRange",
   "cloudera/chart/TimeBrowserState",
   "cloudera/chart/TimeBrowserServerState"
], function(Util, TimeUtil, TimeRange, TimeBrowserState, TimeBrowserServerState) {

  describe("TimeBrowserServerState Tests", function() {
    var now, state;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      var options = {
        isCurrentMode : false,
        firstVisibleDate : new Date(1),
        lastVisibleDate : new Date(10),
        markerDate : new Date(5),
        firstDate : new Date(1),
        lastDate : new Date(20)
      };
      now = new Date(20);
      spyOn(TimeUtil, "getServerNow").andReturn(now);
      state = new TimeBrowserState(options);
    });

    afterEach(function() {
    });

    it("should create a basic server state.", function() {
      var serverState = new TimeBrowserServerState(state);

      expect(serverState.lastTime).toEqual(20);
      expect(serverState.firstTime).toEqual(1);
      expect(serverState.markerTime).toEqual(5);
      expect(serverState.startTime).toEqual(1);
      expect(serverState.endTime).toEqual(10);
    });

    it("should create another server state in the future but they should be considered identical.", function() {
      state.setCurrentMode(true);
      state.setSelectedRange(new TimeRange(new Date(11), new Date(20)));
      state.setMarkerDate(new Date(20));
      var serverState = new TimeBrowserServerState(state);

      now = new Date(30);
      state.moveToNow();
      var serverState1 = new TimeBrowserServerState(state);

      expect(serverState.equals(serverState1)).toBeTruthy();
    });

    it("should create another server state in the past and they should be considered identical.", function() {
      now = new Date(20);
      var serverState = new TimeBrowserServerState(state);
      var serverState1 = new TimeBrowserServerState(state);

      expect(serverState.equals(serverState1)).toBeTruthy();
    });

    it("should create another server state in the past with a different marker date, and they should not be considered identical.", function() {
      var serverState = new TimeBrowserServerState(state);
      state.setMarkerDate(new Date(6));
      var serverState1 = new TimeBrowserServerState(state);
      expect(serverState.equals(serverState1)).toBeFalsy();
    });

    it("should call toParams and fromParams", function() {
      now = new Date(20);
      var serverState = new TimeBrowserServerState(state);

      state.setMarkerDate(new Date(6));
      state.setSelectedRange(new TimeRange(new Date(5), new Date(20)));

      var serverState1 = new TimeBrowserServerState(state);
      serverState.fromParams(serverState1.toParams());

      expect(serverState.equals(serverState1)).toBeTruthy();
    });

    it("should handle empty urlParams object", function() {
      now = new Date(20);
      var serverState = new TimeBrowserServerState(state);
      var serverState1 = new TimeBrowserServerState(state);
      serverState.fromParams({});
      expect(serverState.equals(serverState1)).toBeTruthy();
    });

    it("should still create the TimeBrowserServerState object when the input state is undefined", function() {
      var serverState = new TimeBrowserServerState();
      expect(serverState).toBeDefined();
    });

    it("should call toParams and fromParams when currentMode = false", function() {
      now = new Date(100);
      var serverState = new TimeBrowserServerState(state);

      state.setMarkerDate(new Date(6));
      state.setSelectedRange(new TimeRange(new Date(5), new Date(20)));

      var serverState1 = new TimeBrowserServerState(state);
      serverState1.currentMode = false;
      serverState.fromParams(serverState1.toParams());

      expect(serverState.equals(serverState1)).toBeTruthy();
    });

    it("should call toParams and fromParams when currentMode = true", function() {
      now = new Date(20);
      state.setCurrentMode(true);
      var serverState0 = new TimeBrowserServerState(state);

      // change the state
      state.setMarkerDate(new Date(20));
      state.setSelectedRange(new TimeRange(new Date(10), new Date(20)));
      var serverState1 = new TimeBrowserServerState(state);
      expect(serverState0.equals(serverState1)).toBeFalsy();

      serverState0.fromParams(serverState1.toParams());
      expect(serverState0.equals(serverState1)).toBeTruthy();
    });
  });
});
