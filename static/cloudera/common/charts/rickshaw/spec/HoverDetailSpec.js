// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/charts/rickshaw/HoverDetail'
], function(HoverDetail) {
  describe('HoverDetail', function() {
    it('provides special formatter for certain units', function() {
      var hd = new HoverDetail({
        graph: {
          element: {
            appendChild: jasmine.createSpy('appendChild'),
            addEventListener: jasmine.createSpy('addEventListener')
          },
          onUpdate: jasmine.createSpy('onUpdate')
        }
      });
      // Don't format a TS with units not in one of our acceptable units.
      var ts = {
        name: 'Fake TS'
      };
      var d = null;
      var result = hd.formatter(ts, 0, 1234567, '0', '1234567.00', d);
      expect(result).toContain('1234567');

      // Given a TS with units in bytes, it formats as bytes.
      ts.units = {
        numerators: ['bytes'],
        denominators: []
      };
      result = hd.formatter(ts, 0, 1234567, '0', '1234567.00', d);
      expect(result).toContain('1.2 MiB');
      expect(result).toContain('1234567 B');

      // Now test other supported unit.
      ts.units.numerators = ['ms'];
      result = hd.formatter(ts, 0, 1400, '0', '1400.00', d);
      expect(result).toContain('1.40s');
      expect(result).toContain('1400ms');
    });
  });
});
