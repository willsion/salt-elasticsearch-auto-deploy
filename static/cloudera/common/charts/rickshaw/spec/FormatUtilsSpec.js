// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/I18n',
  'cloudera/common/charts/rickshaw/FormatUtils'
], function(I18n, FormatUtils) {
  describe('FormatUtils', function() {
    var series;

    beforeEach(function() {
      series = {
        name: 'series',
        units: {
          numerators: [],
          denominators: []
        }
      };
    });

    it('can show certain units for the hover detail using rawYValueForHoverDetail', function() {
      var set = function(numerator) {
        series.units.numerators = [numerator];
      };
      var format = FormatUtils.rawYValueForHoverDetail;
      // All the bytes first.
      set('bytes');
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1073741824 B');
      set('kilobytes');
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1073741824 KiB');
      expect(format(series, 32 * 1024 * 1024)).toEqual('33554432 KiB');
      set('megabytes');
      expect(format(series, 4)).toEqual('4 MiB');
      expect(format(series, 4.56 * 1024)).toEqual('4669.44 MiB');

      // Now do time.
      set('nanos');
      expect(format(series, 34 * 1000 * 1000 * 1000)).toEqual('34000000000ns');
      expect(format(series, 34 * 1000 * 1000)).toEqual('34000000ns');
      expect(format(series, 34)).toEqual('34ns');
      expect(format(series, 850 * 1000)).toEqual('850000ns');
      set('micros');
      expect(format(series, 34)).toEqual('34\u00B5s');
      expect(format(series, 34 * 1000 * 1000)).toEqual('34000000\u00B5s');
      expect(format(series, 34 * 1000)).toEqual('34000\u00B5s');
      set('ms');
      expect(format(series, 45 * 1000)).toEqual('45000ms');
      expect(format(series, 67)).toEqual('67ms');
      set('seconds');
      expect(format(series, 8)).toEqual('8s');
      expect(format(series, 970)).toEqual('970s');
      expect(format(series, 0.006)).toEqual('0.01s');
      expect(format(series, 0.0060)).toEqual('0.01s');
      expect(format(series, 0.004)).toEqual('0.004s');
      expect(format(series, 0.0040)).toEqual('0.004s');
    });

    it('can show certain units for the hover detail', function() {
      var set = function(numerator) {
        series.units.numerators = [numerator];
      };
      var format = FormatUtils.formatYValueForHoverDetail;
      // All the bytes first.
      set('bytes');
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1.0 GiB');
      set('kilobytes');
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1.0 TiB');
      expect(format(series, 32 * 1024 * 1024)).toEqual('32.0 GiB');
      set('megabytes');
      expect(format(series, 4)).toEqual('4.0 MiB');
      expect(format(series, 4.56 * 1024)).toEqual('4.6 GiB');

      // Now do time.
      set('nanos');
      expect(format(series, 34 * 1000 * 1000 * 1000)).toEqual('34.00s');
      expect(format(series, 34 * 1000 * 1000)).toEqual('34ms');
      expect(format(series, 34)).toEqual('34ns');
      expect(format(series, 850 * 1000)).toEqual('850.00\u00B5s');
      set('micros');
      expect(format(series, 34)).toEqual('34.00\u00B5s');
      expect(format(series, 34 * 1000 * 1000)).toEqual('34.00s');
      expect(format(series, 34 * 1000)).toEqual('34ms');
      set('ms');
      expect(format(series, 45 * 1000)).toEqual('45.00s');
      expect(format(series, 67)).toEqual('67ms');
      set('seconds');
      expect(format(series, 8)).toEqual('8.00s');
      expect(format(series, 970)).toEqual('16.2m');
    });

    it('uses first numerator for label', function() {
      series.units.numerators = ["bytes", "operations"];
      var format = FormatUtils.formatYValueForHoverDetail;
      // All the bytes first.
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1.0 GiB');
      series.units.numerators = ["operations", "foobar"];
      expect(format(series, 1024)).toEqual('1024 operations');
    });

    it('uses first numerator for label in the function rawYValueForHoverDetail', function() {
      series.units.numerators = ["bytes", "operations"];
      var format = FormatUtils.rawYValueForHoverDetail;
      // All the bytes first.
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1073741824 B');
      series.units.numerators = ["operations", "foobar"];
      expect(format(series, 1024)).toEqual('1024 operations');
    });

    it('uses first denominator for label', function() {
      series.units.numerators = ["bytes", "operations"];
      series.units.denominators = ["seconds"];
      var format = FormatUtils.formatYValueForHoverDetail;
      // All the bytes first.
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1.0 GiB / second');
      series.units.numerators = ["operations", "foobar"];
      series.units.denominators = ["seconds", "barfoo"];
      expect(format(series, 1024)).toEqual('1024 operations / second');
    });

    it('uses first denominator for label in the function rawYValueForHoverDetail', function() {
      series.units.numerators = ["bytes", "operations"];
      series.units.denominators = ["seconds"];
      var format = FormatUtils.rawYValueForHoverDetail;
      // All the bytes first.
      expect(format(series, 1024 * 1024 * 1024)).toEqual('1073741824 B / second');
      series.units.numerators = ["operations", "foobar"];
      series.units.denominators = ["seconds", "barfoo"];
      expect(format(series, 1024)).toEqual('1024 operations / second');
    });

    it('shows not-a-number in the units label for NaN y values', function() {
      series.units.numerators = ["bytes", "operations"];
      series.units.denominators = ["seconds"];
      var format = FormatUtils.formatYValueForHoverDetail;
      // All the bytes first.
      var formattedY = format(series, 0, "NaN");
      // We don't have I18n enabled in Jasmine so I18n.t will return the label
      // itself during unit-tests.
      expect(formattedY.toLowerCase()).toEqual('ui.chart.nan');
    });

    it('shows not-a-number in the units label for NaN y values in the function rawYValueForHoverDetail', function() {
      series.units.numerators = ["bytes", "operations"];
      series.units.denominators = ["seconds"];
      var format = FormatUtils.rawYValueForHoverDetail;
      // All the bytes first.
      var formattedY = format(series, 0, "NaN");
      // We don't have I18n enabled in Jasmine so I18n.t will return the label
      // itself during unit-tests.
      expect(formattedY.toLowerCase()).toEqual('');
    });

    it('can format certain units for the y axis', function() {
      var units = {
        numerators: [],
        denominators: []
      };
      var setNumerator = function(numerator) {
        units.numerators = [numerator];
      };
      var setDenominator = function(denominator) {
        units.denominators = [denominator];
      };

      // All the bytes first.
      setNumerator('bytes');
      var format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(1024 * 1024 * 1024)).toEqual('1.0G');
      expect(format(100 * 1024 * 1024 * 1024)).toEqual('100G');
      expect(format(0)).toEqual('');
      setNumerator('kilobytes');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(1024 * 1024 * 1024)).toEqual('1.0T');
      expect(format(32 * 1024 * 1024)).toEqual('32.0G');
      expect(format(10 * 32 * 1024 * 1024)).toEqual('320G');
      expect(format(0)).toEqual('');
      setNumerator('megabytes');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(4)).toEqual('4.0M');
      expect(format(4.56 * 1024)).toEqual('4.6G');
      expect(format(10 * 4.56 * 1024)).toEqual('45.6G');
      expect(format(100 * 4.560001 * 1024)).toEqual('456G');
      expect(format(0)).toEqual('');
      
      // None bytes / seconds.
      setNumerator('bytes');
      setDenominator('seconds');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(1024 * 1024 * 1024)).toEqual('1.0G/s');
      expect(format(100 * 1024 * 1024 * 1024)).toEqual('100G/s');
      expect(format(0)).toEqual('');
      setNumerator('kilobytes');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(1024 * 1024 * 1024)).toEqual('1.0T/s');
      expect(format(32 * 1024 * 1024)).toEqual('32.0G/s');
      expect(format(0)).toEqual('');
      setNumerator('megabytes');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(4)).toEqual('4.0M/s');
      expect(format(4.56 * 1024)).toEqual('4.6G/s');
      expect(format(0)).toEqual('');

      // Now do time.
      setNumerator('nanos');
      units.denominators = [];
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(34 * 1000 * 1000 * 1000)).toEqual('34.00s');
      expect(format(34 * 1000 * 1000)).toEqual('34ms');
      expect(format(0)).toEqual('');
      setNumerator('micros');
      units.denominators = [];
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(34 * 1000 * 1000)).toEqual('34.00s');
      expect(format(34 * 1000)).toEqual('34ms');
      expect(format(0)).toEqual('');
      setNumerator('ms');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(45 * 1000)).toEqual('45.00s');
      expect(format(67)).toEqual('67ms');
      expect(format(0)).toEqual('');
      setNumerator('seconds');
      format = FormatUtils.getYAxisTickFormatFunction(units);
      expect(format(8)).toEqual('8.00s');
      expect(format(970)).toEqual('16.2m');
      expect(format(0)).toEqual('');
    });

    it('should test getYAxisLabel', function() {
      var groupTs = [ {
        metadata: {
          units: {
            numerators: ["bytes", "operations"],
            denominators: ["seconds"]
          }
        }
      }, {
        metadata: {
          units: {
            numerators: ["bytes", "operations"],
            denominators: ["seconds"]
          }
        }
      } ];
      expect(FormatUtils.getYAxisLabel(groupTs)).toEqual("bytes operations / second");
    });

    it('should test getYAxisLabel with different units', function() {
      var groupTs = [ {
        metadata: {
          units: {
            numerators: ["bytes"],
            denominators: ["seconds"]
          }
        }
      }, {
        metadata: {
          units: {
            numerators: ["bytes", "operations"],
            denominators: ["seconds"]
          }
        }
      } ];
      expect(FormatUtils.getYAxisLabel(groupTs)).toEqual(I18n.t("ui.mixedUnits"));
    });

    it('should test getYAxisLabel with no data', function() {
      var groupTs = [];
      expect(FormatUtils.getYAxisLabel(groupTs)).toEqual("");
    });    
  });
});
