// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/charts/rickshaw/AxisY',
  'underscore'
], function(AxisY, _) {
  describe('AxisY', function() {
    var createMockGraph = function() {
      return {
        onUpdate: jasmine.createSpy('onUpdate'),
        width: 640,
        height: 480
      };
    };

    it('monkey patches the AxisY instance with a setUnits function', function() {
      var y = new AxisY({
        graph: createMockGraph()
      });
      expect(_.isFunction(y.setUnits)).toBeTruthy();
      y.setUnits({
        numerators: ['bytes'],
        denominators: []
      });
      expect(y.units).toBeDefined();
      expect(y.units.numerators[0]).toEqual('bytes');
      expect(y.units.denominators.length).toEqual(0);
    });

    it('monkey-patches the AxisY implementation of setSize', function() {
      // Note that the element is not attached to the documentElement.
      var elem = document.createElement('div');
      var options = {
        graph: createMockGraph(),
        width: 100,
        height: 20,
        element: elem
      };
      var y = new AxisY(options);
      expect(y.width).toEqual(options.width);
      y.setSize({auto: true});
      // This would fail if we weren't wrapping setSize correctly.
      expect(y.width).toEqual(options.width);
    });
  });
});
