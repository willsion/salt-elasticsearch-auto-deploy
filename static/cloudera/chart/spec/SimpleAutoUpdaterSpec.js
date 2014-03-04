// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/SimpleAutoUpdater',
  'cloudera/chart/TimeBrowserState'
], function(SimpleAutoUpdater, TimeBrowserState) {
  describe("SimpleAutoUpdater", function() {
    var simpleAutoUpdater;
    var state = new TimeBrowserState({
       firstDate: new Date(910),
      lastDate: new Date(1000),
      firstVisibleDate: new Date(950),
      lastVisibleDate: new Date(1000),
      markerDate: new Date(1000),
      isCurrentMode: true
    });
    var options = {
      updateIntervalInMS: 10000,
      state: state
    };

    beforeEach(function() {
      simpleAutoUpdater = new SimpleAutoUpdater(options);
    });

    afterEach(function() {
      simpleAutoUpdater = null;
    });

    it("should call moveToNow when refresh is called", function() {
      spyOn(state, "moveToNow");
      spyOn(simpleAutoUpdater, "hasOpenMenu").andReturn(false);
      simpleAutoUpdater.refresh();
      expect(state.moveToNow).wasCalledWith(null, true);
    });

    it("should not call moveToNow when pauseAutoRefresh is triggered", function() {
      spyOn(state, "moveToNow");
      $.publish("pauseAutoRefresh");
      simpleAutoUpdater.refresh();
      expect(state.moveToNow).wasNotCalled();

      $.publish("unpauseAutoRefresh");
      simpleAutoUpdater.refresh();
      expect(state.moveToNow).wasCalled();
    });
  });
});


