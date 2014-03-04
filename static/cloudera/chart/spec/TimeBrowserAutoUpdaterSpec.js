// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/Util",
   "cloudera/chart/TimeBrowserState",
   "cloudera/chart/TimeBrowserAutoUpdater"
], function(Util, TimeBrowserState, TimeBrowserAutoUpdater) {

  describe("TimeBrowserAutoUpdater Tests", function() {
    var id = "autoUpdaterMarkerContainer", options, state, autoUpdater;

    beforeEach(function() {
      jasmine.Ajax.useMock();
      var $markerContainer = $("<div>").css("width", 1000).attr("id", id);
      $("body").append($markerContainer);

      options = {
        markerContainer: $("#" + id),
        isCurrentMode : false,
        firstVisibleDate : new Date(1),
        lastVisibleDate : new Date(10),
        markerDate : new Date(5),
        firstDate : new Date(1),
        lastDate : new Date(20)
      };

      spyOn(window, "setTimeout");
      // Temporarily set it to false so we can test callAutoUpdate().
      Util.setTestMode(false);
      state = new TimeBrowserState(options);
      autoUpdater = new TimeBrowserAutoUpdater(options, state);
    });

    afterEach(function() {
      Util.setTestMode(true);
      $("#" + id).remove();
    });

    it("should auto update at least once", function() {
      expect(window.setTimeout).wasCalled();
    });

    it("should get auto update interval", function() {
      // when displaying a 10 hour window, 3600 * 10 * 1000,
      // the interval should be around 70 seconds.
      var interval = autoUpdater.getAutoUpdateInterval();
      expect(interval).toEqual(30000);
    });

    it("should calculate the auto update interval", function() {
      // when displaying a 10 hour window, 3600 * 10 * 1000,
      // the interval should be around 70 seconds.
      var interval = autoUpdater.calculateAutoUpdateInterval(36000000, 1000);
      expect(interval).toEqual(70000);
    });

    it("should calculate the minimum auto update interval", function() {
      // when displaying a 1 hour window, 3600 * 1000,
      // the interval should be set to the minimum, which is 30 seconds.
      var interval = autoUpdater.calculateAutoUpdateInterval(3600000, 1000);
      expect(interval).toEqual(30000);
    });

    it("should pause the auto refresh", function() {
      jQuery.publish("pauseAutoRefresh");
      expect(autoUpdater.isRunning).toBeFalsy();

      jQuery.publish("unpauseAutoRefresh");
      expect(autoUpdater.isRunning).toBeTruthy();
    });

    it('should pass param indicating auto update', function() {
      spyOn(state, 'moveToNow');
      spyOn(state, 'getCurrentMode').andReturn(true);
      autoUpdater.start();
      autoUpdater.autoUpdate();
      expect(state.moveToNow).wasCalled();
      var args = state.moveToNow.mostRecentCall.args;
      expect(args.length).toEqual(2);
      expect(args[0]).toBeFalsy();
      // Not just truthy -- true.
      expect(args[1]).toEqual(true);
    });
  });
});
