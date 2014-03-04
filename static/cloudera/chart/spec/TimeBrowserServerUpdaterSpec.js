// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/common/TimeUtil",
   "cloudera/chart/TimeRange",
   "cloudera/chart/TimeBrowserState",
   "cloudera/chart/TimeBrowserServerUpdater"
], function(Util, TimeUtil, TimeRange, TimeBrowserState, TimeBrowserServerUpdater) {

  describe("TimeBrowserServerUpdater Tests", function() {
    var state, updater;

    beforeEach(function() {
      spyOn(TimeUtil, "getServerNow").andReturn(new Date(20));
      var options = {
        isCurrentMode : false,
        firstVisibleDate : new Date(1),
        lastVisibleDate : new Date(10),
        markerDate : new Date(5),
        firstDate : new Date(1),
        lastDate : new Date(20)
      };

      state = new TimeBrowserState(options);
      updater = new TimeBrowserServerUpdater(options, state);
      spyOn(updater, "updateServer").andCallThrough();
      spyOn(updater, "update").andCallThrough();
    });

    afterEach(function() {
    });

    it("should not call updateServer because state has not changed.", function() {
      expect(updater.updateServer.callCount).toEqual(0);
      updater.update();
      updater.update();
      expect(updater.updateServer.callCount).toEqual(0);
    });

    it("should call updateServer exactly once.", function() {
      state.setSelectedRange(new TimeRange(new Date(2), new Date(20)));
      expect(updater.updateServer.callCount).toEqual(0);
      updater.update();
      updater.update();
      expect(updater.updateServer.callCount).toEqual(1);
    });

  });
});
