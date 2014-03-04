// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/TimeUtil',
  'cloudera/common/charts/rickshaw/AxisTime'
], function(TimeUtil, AxisTime) {
  describe("AxisTime Tests", function() {
    var oldTimezoneDelta, mockGraph, module;

    beforeEach(function() {
      oldTimezoneDelta = TimeUtil.getTimezoneDelta();
      mockGraph = {
        width: 480,
        height: 320,
        onUpdate: function() {}
      };
      module = new AxisTime({
        graph: mockGraph
      });
    });

    afterEach(function() {
      TimeUtil.setTimezoneDelta(oldTimezoneDelta);
    });

    it("should calculate ticks", function() {
      // Make server time and local time identical.
      TimeUtil.setTimezoneDelta(0);

      var fakeTicks = [];
      spyOn(module, "renderTickTextAt").andCallFake(function(tickText, tickPosition) {
        fakeTicks.push({
          text: tickText,
          pos: tickPosition
        });
      });
      spyOn(module, "getXDomain").andReturn([
        // December 1st, 2012 to December 2nd, 2012
        new Date(2012, 11, 1),
        new Date(2012, 11, 2)
      ]);
      spyOn(module, "getXRange").andReturn([0, 480]);

      module.render();
      expect([
        { text : 'December', pos : 0 },
        { text : '03 AM', pos : 60 },
        { text : '06 AM', pos : 120 },
        { text : '09 AM', pos : 180 },
        { text : '12 PM', pos : 240 },
        { text : '03 PM', pos : 300 },
        { text : '06 PM', pos : 360 },
        { text : '09 PM', pos : 420 },
        { text : 'Dec 02', pos : 480 }
      ]).toEqual(fakeTicks);
    });

    it("should calculate ticks when the server timezone is different", function() {
      // Make server time different by 12 hours
      TimeUtil.setTimezoneDelta(12 * 3600 * 1000);

      var fakeTicks = [];
      spyOn(module, "renderTickTextAt").andCallFake(function(tickText, tickPosition) {
        fakeTicks.push({
          text: tickText,
          pos: tickPosition
        });
      });
      spyOn(module, "getXDomain").andReturn([
        // locally from December 1st, 2012 to December 1st Noon,
        // but when displayed in server timezone
        new Date(2012, 11, 1),
        new Date(2012, 11, 1, 12)
      ]);
      spyOn(module, "getXRange").andReturn([0, 480]);

      module.render();
      expect([{
        text : '12 PM',
        pos : 0
      }, {
        text : '03 PM',
        pos : 120
      }, {
        text : '06 PM',
        pos : 240
      }, {
        text : '09 PM',
        pos : 360
      }, {
        text : 'Dec 02',
        pos : 480
      }]).toEqual(fakeTicks);
    });

  });
});
