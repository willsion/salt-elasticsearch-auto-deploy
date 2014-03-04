// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/TimeBrowserSessionStorage',
  'cloudera/chart/TimeBrowserServerState',
  'cloudera/chart/TimeBrowserState',
  'cloudera/common/SessionStorage'
], function(TimeBrowserSessionStorage, TimeBrowserServerState, TimeBrowserState, SessionStorage) {
  describe("TimeBrowserSessionStorage Tests", function() {
    var module;

    beforeEach(function() {
      module = new TimeBrowserSessionStorage();
    });

    afterEach(function() {
    });

    it("should test setServertate.", function() {
      spyOn(SessionStorage, "setItem");
      var options = {
        firstDate: new Date(910),
        lastDate: new Date(1000),
        firstVisibleDate: new Date(950),
        lastVisibleDate: new Date(1000),
        markerDate: new Date(1000),
        isCurrentMode: true
      };
      var state = new TimeBrowserState(options);
      var serverState = new TimeBrowserServerState(state);
      module.setServerState(serverState);

      expect(SessionStorage.setItem).wasCalledWith(module.sessionKey, {
        firstTime: 910,
        lastTime: 1000,
        startTime: 950,
        endTime: 1000,
        markerTime: 1000,
        currentMode: true
      });
    });

    it("should test getServerState.", function() {
      spyOn(SessionStorage, "getItem").andReturn({
        firstTime: 810,
        lastTime: 2000,
        startTime: 850,
        endTime: 2000,
        markerTime: 2000,
        currentMode: false
      });

      var serverState = module.getServerState();

      expect(serverState.toParams()).toEqual({
        firstTime: 810,
        lastTime: 2000,
        startTime: 850,
        endTime: 2000,
        markerTime: 2000,
        currentMode: false
      });
    });
  });
});
