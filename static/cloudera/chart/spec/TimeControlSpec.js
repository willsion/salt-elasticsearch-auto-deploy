// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/chart/TimeControl'
], function(TimeControl) {
  describe("TimeControl Tests", function() {
    var baseOptions = {
      id: "tc",
      mode: "INTERACTIVE",
      firstDate: new Date(1),
      lastDate: new Date(10),
      firstVisibleDate: new Date(5),
      lastVisibleDate: new Date(10),
      markerDate: new Date(7),
      isCurrentMode: false,
      showRange: true,
      showMarker: true,
      minUpdateIntervalInMS: 5000
    };
    var tc;

    beforeEach(function() {
      jasmine.Ajax.useMock();
    });

    afterEach(function() {
      $("#" + baseOptions.id).remove();
      tc.unsubscribe();
    });

    it("should create a TimeControl2 object when mode === INTERACTIVE", function() {
      var options = $.extend({}, baseOptions, {
        mode: "INTERACTIVE"
      });
      tc = new TimeControl(options);
      expect(tc.timeControl).toBeDefined();
      expect(tc.timeControlMini).toBeUndefined();
    });

    it("should create a TimeControl2 object when mode === READONLY", function() {
      var options = $.extend({}, baseOptions, {
        mode: "READONLY"
      });
      tc = new TimeControl(options);
      expect(tc.timeControl).toBeDefined();
      expect(tc.timeControlMini).toBeUndefined();
    });

    it("should NOT create a TimeControl2 object when mode === TIMEONLY", function() {
      var options = $.extend({}, baseOptions, {
        mode: "TIMEONLY"
      });
      tc = new TimeControl(options);
      expect(tc.timeControl).toBeUndefined();
      expect(tc.timeControlMini).toBeDefined();
      expect(tc.labelUpdater).toBeDefined();
      expect(tc.updater).toBeDefined();
      expect(tc.state).toBeDefined();
    });

    it("should create a largePlotDialog object", function() {
      var options = $.extend({}, baseOptions, {
        mode: "TIMEONLY"
      });
      tc = new TimeControl(options);
      expect(tc.largePlotDialog).toBeDefined();
    });
  });
});
