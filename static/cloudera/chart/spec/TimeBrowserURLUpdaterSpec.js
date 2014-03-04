// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
   "cloudera/chart/TimeBrowserURLUpdater",
   "cloudera/chart/TimeBrowserServerState",
   "cloudera/chart/TimeBrowserState",
   "cloudera/Util",
   "cloudera/common/UrlParams"
], function(TimeBrowserURLUpdater, TimeBrowserServerState, TimeBrowserState, Util, UrlParams) {

  describe("TimeBrowserURLUpdater Tests", function() {
    var state, updater;

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
      state = new TimeBrowserState(options);
      updater = new TimeBrowserURLUpdater(state);
    });

    afterEach(function() {
      updater.unsubscribe();
    });

    it('should not update url if the local server state has not changed', function() {
      spyOn(UrlParams, 'set');
      updater.update();
      expect(UrlParams.set).wasNotCalled();
    });

    it('should update url if the local server state has changed', function() {
      spyOn(UrlParams, 'set');
      state.firstDate = new Date(state.firstDate.getTime() + 1);
      updater.update();
      expect(UrlParams.set).wasCalled();
    });

    it('should update from UrlParams', function() {
      spyOn(updater.state, 'setFromServerState');
      UrlParams.set({
        startTime: 42,
        endTime: 2012
      });
      updater.updateFromURLParams();
      expect(updater.state.setFromServerState).wasCalled();
      var args = updater.state.setFromServerState.mostRecentCall.args;
      expect(args[0].startTime).toEqual(42);
      expect(args[0].endTime).toEqual(2012);
    });

    it('should update from UrlParams only once', function() {
      spyOn(updater.state, 'setFromServerState').andCallThrough();
      UrlParams.set({
        startTime: 42,
        endTime: 2012
      });
      updater.updateFromURLParams();
      expect(updater.state.setFromServerState).wasCalled();

      // Update the again, but because URL values are not changed,
      // the call count remains to be 1.
      updater.updateFromURLParams();
      expect(updater.state.setFromServerState.callCount).toEqual(1);
    });

    // This test is flaky: it fails with different actual values per test
    // run. andyao and drhayes spent some time trying to run down the cause
    // but couldn't find it. Event subscription in zombie closures hanging
    // around in _.defer blocks is the leading candidate.
    // Be afraid. Be very afraid.
    xit("should update itself with values from the URL Params.",function() {
      console.group('time browser url updater spec test');
      UrlParams.set({
        currentMode: false,
        startTime: 1,
        endTime: 10,
        markerTime: 5,
        firstTime: 1,
        lastTime: 20
      });
      updater.updateFromURLParams();
      expect(state.firstVisibleDate.getTime()).toEqual(1);
      expect(state.lastVisibleDate.getTime()).toEqual(10);
      expect(state.markerDate.getTime()).toEqual(5);
      expect(state.firstDate.getTime()).toEqual(1);
      expect(state.lastDate.getTime()).toEqual(20);
      expect(state.isCurrentMode).toEqual(false);

      UrlParams.set({
        currentMode: false,
        startTime: 100,
        endTime: 200,
        markerTime: 150,
        firstTime: 20,
        lastTime: 300
      });
      updater.updateFromURLParams();
      expect(state.firstDate.getTime()).toEqual(20);
      expect(state.lastDate.getTime()).toEqual(300);
      expect(state.isCurrentMode).toEqual(false);
      expect(state.firstVisibleDate.getTime()).toEqual(100);
      expect(state.isCurrentMode).toEqual(false);

      UrlParams.set({
        currentMode: true,
        startTime: 100,
        endTime: 200,
        markerTime: 150,
        firstTime: 20,
        lastTime: 300
      });
      updater.updateFromURLParams();
      expect(state.firstVisibleDate.getTime()).toEqual(100);
      expect(state.isCurrentMode).toEqual(true);
      console.groupEnd();
    });
  });
});
