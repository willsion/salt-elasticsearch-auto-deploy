// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/charts/include/TimeSeriesLinearSampler',
  'underscore'
], function(TimeSeriesLinearSampler, _) {
  describe("TimeSeriesLinearSampler Tests", function() {

    var module = TimeSeriesLinearSampler;
    var DEFAULT_CHART_WIDTH = 200;

    it("should downsample one stream with too many points", function() {
      var data = [];
      var ii;
      for (ii = 0; ii < 1000; ++ii) {
        data.push({x: ii, y: ii * 10});
      }
      var groupTs = [{
        data: data,
        metadata: {
            attributes: {"a": "a0"}
        }
        }];
      module.sampleTimeSeriesGroup(groupTs, DEFAULT_CHART_WIDTH);
      expect(groupTs[0].data.length).toEqual(DEFAULT_CHART_WIDTH);
      expect(groupTs[0].originalData.length).toEqual(1000);
      // verify that it was not modified.
      for (ii = 0; ii < 1000; ++ii) {
        expect(groupTs[0].originalData[ii].x).toEqual(ii);
        expect(groupTs[0].originalData[ii].y).toEqual(ii * 10);
      }
    });

    it("should not downsample one stream with fewer points", function() {
      var data = [];
      var ii;
      for (ii = 0; ii < 50; ++ii) {
        data.push({x: ii, y: ii * 10});
      }
      var groupTs = [{
        data: data,
        metadata: {
            attributes: {"a": "a0"}
        }
        }];
      module.sampleTimeSeriesGroup(groupTs, DEFAULT_CHART_WIDTH);
      expect(groupTs[0].data.length).toEqual(50);
      expect(groupTs[0].originalData.length).toEqual(50);
      // verify that it was not modified.
      for (ii = 0; ii < 50; ++ii) {
        expect(groupTs[0].originalData[ii].x).toEqual(ii);
        expect(groupTs[0].data[ii].x).toEqual(ii);
        expect(groupTs[0].originalData[ii].y).toEqual(ii * 10);
        expect(groupTs[0].originalData[ii].y).toEqual(ii * 10);
      }
    });
    
    it("_shouldSampleStreams should work correctly", function() {
      var data1 = [];
      var data2 = [];
      var ii;
      for (ii = 0; ii < 50; ++ii) {
        data1.push({x: ii, y: ii * 10});
        data2.push({x: ii, y: ii * 20});
      }
      var groupTs = [{
        data: data1,
        metadata: {
            attributes: {"a": "a0"}
        }
      }, {
        data: data2,
        metadata: {
            attributes: {"a": "a0"}
        }
      } ];
      expect(module._shouldSampleStreams(groupTs, 50, 50)).toEqual(false);
      expect(module._shouldSampleStreams(groupTs, 49, 50)).toEqual(true);
      expect(module._shouldSampleStreams(groupTs, 50, 49)).toEqual(true);
      // Add a point to data2.
      data2.push({x: 1000, y: 2000});
      expect(module._shouldSampleStreams(groupTs, 100, 100)).toEqual(true);
      // add the same point to data1.
      data1.push({x: 1000, y: 2000});
      expect(module._shouldSampleStreams(groupTs, 100, 100)).toEqual(false);
      // Change one point
      data1[50].x = 999;
      expect(module._shouldSampleStreams(groupTs, 100, 100)).toEqual(true);
    });

    it("should sample multiple streams correctly", function() {
      var data1 = [];
      var data2 = [];
      var ii;
      for (ii = 1; ii <= 1000; ++ii) {
        data1.push({x: ii, y: ii * 10});
        data2.push({x: ii * 2, y: ii * 20});
      }
      var groupTs = [{
        data: data1,
        metadata: {
            attributes: {"a": "a0"}
        }
      }, {
        data: data2,
        metadata: {
            attributes: {"a": "a0"}
        }
      } ];
      module.sampleTimeSeriesGroup(groupTs, DEFAULT_CHART_WIDTH);
      expect(groupTs[0].data.length).toEqual(DEFAULT_CHART_WIDTH);
      expect(groupTs[1].data.length).toEqual(DEFAULT_CHART_WIDTH);
      expect(groupTs[0].originalData.length).toEqual(1000);
      expect(groupTs[1].originalData.length).toEqual(1000);
      // verify that the original streams where not modified.
      for (ii = 0; ii < 1000; ++ii) {
        expect(groupTs[0].originalData[ii].x).toEqual(ii + 1);
        expect(groupTs[0].originalData[ii].y).toEqual((ii + 1) * 10);
        expect(groupTs[1].originalData[ii].x).toEqual((ii + 1) * 2);
        expect(groupTs[1].originalData[ii].y).toEqual((ii + 1) * 20);
      }
      // verify that they both have exactly the same timestamps.
      for (ii = 0; ii < DEFAULT_CHART_WIDTH; ++ii) {
        expect(groupTs[0].data[ii].x).toEqual(groupTs[1].data[ii].x);
      }
      // The minimum x should be from the first time series and the maximum
      // x should be from the second.
      expect(groupTs[0].data[0].x).toEqual(1);
      expect(groupTs[0].data[199].x).toEqual(2000);
    });

    it("should handle streams with one point gracefully", function() {
      var createFakePlot = function(xVal, yVal) {
        return {
          data: [{x: xVal, y: yVal}],
          metadata: {
            attributes: {}
          }
        };
      };
      var ii;
      var groupTs = [];
      for (ii = 0; ii < 50; ++ii) {
        groupTs.push(createFakePlot(1, 2));
      }
      module.sampleTimeSeriesGroup(groupTs, DEFAULT_CHART_WIDTH);
      // We should have exactly the same streams.
      for (ii = 0 ; ii < 50; ++ii) {
        expect(groupTs[ii].data.length).toEqual(1);
        expect(groupTs[ii].data[0].x).toEqual(1);
        expect(groupTs[ii].data[0].y).toEqual(2);
        expect(groupTs[ii].hasOwnProperty("originalData")).toEqual(false);
      }

      // Now, create streams with one point, at either x or x+1 (i.e., 1 ms apart).
      groupTs = [];
      for (ii = 0; ii < 50; ++ii) {
        if (ii % 2 === 0) {
          groupTs.push(createFakePlot(1, 2));
        } else {
          groupTs.push(createFakePlot(2, 4));
        }
      }

      module.sampleTimeSeriesGroup(groupTs, DEFAULT_CHART_WIDTH);
      for (ii = 0 ; ii < 50; ++ii) {
        expect(groupTs[ii].data.length).toEqual(2);
        expect(groupTs[ii].data[0].x).toEqual(1);
        expect(groupTs[ii].data[1].x).toEqual(2);
        expect(groupTs[ii].originalData.length).toEqual(1);
        if (ii % 2 === 0) {
          expect(groupTs[ii].originalData[0].x).toEqual(1);
          expect(groupTs[ii].data[0].y).toEqual(2);
          expect(groupTs[ii].data[1].y).toEqual(2);
        } else {
          expect(groupTs[ii].originalData[0].x).toEqual(2);
          expect(groupTs[ii].data[0].y).toEqual(4);
          expect(groupTs[ii].data[1].y).toEqual(4);
        }
      }
    });
  });
});
