// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/charts/include/TimeSeriesUtil"
], function(TimeSeriesUtil) {

  var buildArgs = function(data, numPoints, interpolation) {
    return {timeSeriesData: data,
            numPoints: numPoints,
            interpolationAlgorithm: interpolation};
  };

  describe("TimeSeriesUtil Tests", function() {

    it("return the same array if already short", function() {
      var data = [{x: 1, y: 1}, {x: 2, y: 2}];
      var result = TimeSeriesUtil.downSample(buildArgs(data, 5, "linear"));
      expect(result).toEqual(data);
    });

    it("throws an exception if algorithm is unknown", function() {
      var data = [{x: 1, y: 1}, {x: 2, y: 2}];
      expect(function () {
        var result = TimeSeriesUtil.downSample(buildArgs(data, 1, "kaboom"));
      }).toThrow();
    });

    it("throws an exception if numPoints is smaller than 0", function() {
      var data = [{x: 1, y: 1}, {x: 2, y: 2}];
      expect(function () {
        var result = TimeSeriesUtil.downSample(buildArgs(data, -1, "linear"));
      }).toThrow();
    });

    it("returns an empty array if numPoints is zero", function() {
      var data = [{x: 1, y: 1}, {x: 2, y: 2}];
      var result = TimeSeriesUtil.downSample(buildArgs(data, 0, "linear"));
      expect(result).toEqual([]);
    });

    it("culls duplicated points", function() {
      var data = [{x: 1, y: 1}];
      var ii;
      for (ii = 0; ii < 100; ii++) {
        data.push({x: 10, y: 1});
      }
      var result = TimeSeriesUtil.downSample(buildArgs(data, 50, "linear"));
      expect(result.length).toEqual(2);
      expect(result[0]).toEqual({x: 1, y: 1});
      expect(result[1]).toEqual({x:10, y: 1});
    });

    it("should downSample linearly", function() {
      var data = [];
      var ii;
      var interval = 1000 / 99;
      var expectedX;
      for (ii = 1; ii <= 1001; ii++) {
        data.push({x: ii, y: ii * 10});
      }
      var result = TimeSeriesUtil.downSample(buildArgs(data, 100, "linear"));
      expect(result.length).toEqual(100);
      expect(result[0]).toEqual({x: 1, y: 10});
      expect(result[98]).toEqual({x: 990, y: 9900});
      expect(result[99]).toEqual({x: 1001, y: 10010});

      for (ii = 1; ii < 99; ii++) {
        expectedX = 1 + parseInt(ii * interval, 10);
        expect(result[ii].x).toEqual(expectedX);
        expect(result[ii].y).toEqual(expectedX * 10);
      }
    });

    it("should handle NaN correctly", function() {
      var data = [];
      var ii;
      var interval = 1000 / 99;
      var expectedX;
      for (ii = 1; ii <= 1001; ii++) {
        data.push({x: ii, y: "NaN"});
      }
      var result = TimeSeriesUtil.downSample(buildArgs(data, 100, "linear"));
      expect(result.length).toEqual(100);
      expect(result[0]).toEqual({x: 1, y: 0, originalY: "NaN"});
      expect(result[98]).toEqual({x: 990, y: 0, originalY: "NaN"});
      expect(result[99]).toEqual({x: 1001, y: 0, originalY: "NaN"});
      for (ii = 1; ii < 99; ii++) {
        expectedX = 1 + parseInt(ii * interval, 10);
        expect(result[ii].x).toEqual(expectedX);
        expect(result[ii].y).toEqual(0);
        expect(result[ii].originalY).toEqual("NaN");
      }
    });

    it("should throw if generateSamplePoints is passed bad arguments", function () {
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(null, 1, 1);
      }).toThrow();
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(1, null, 1);
      }).toThrow();
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(1, 1, null);
      }).toThrow();
      // num of points < 2
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(1, 100, 1);
      }).toThrow();
      // start == end
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(100, 100, 5);
      }).toThrow();
      // start > end
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(101, 100, 5);
      }).toThrow();
      // end - start < numPoints
      expect(function () {
        TimeSeriesUtil.generateSamplePoints(101, 103, 5);
      }).toThrow();
    });

    it("should generate the right number of x points at the right time", function() {
      var xArr = TimeSeriesUtil.generateSamplePoints(1, 1001, 100);
      expect(xArr.length).toEqual(100);
      expect(xArr[0]).toEqual(1);
      expect(xArr[98]).toEqual(990);
      expect(xArr[99]).toEqual(1001);
    });

    it("sample should throw with bad arguments", function() {
      expect(function () {
        TimeSeriesUtil.sample([{x: 1, y: 1}], [1, 2], "kaboom");
      }).toThrow();
      expect(function () {
        TimeSeriesUtil.sample(null, [1, 2], "linear");
      }).toThrow();
      expect(function () {
        TimeSeriesUtil.sample([{x: 1, y: 1}], null, "linear");
      }).toThrow();
    });
    
    it("sample should return an empty arry if data or sample points are empty", function() {
      expect(TimeSeriesUtil.sample([], [1, 2], "linear")).toEqual([]);
      expect(TimeSeriesUtil.sample([{x: 1, y: 1}], [], "linear")).toEqual([]);
    });

    it("sample should return a constant stream for a single point", function() {
      var xArr = TimeSeriesUtil.generateSamplePoints(1, 1001, 100);
      var result = TimeSeriesUtil.sample([{x: 1, y: 1}], xArr, "linear");
      var ii;
      expect(result.length).toEqual(100);
      for (ii = 0; ii < 100; ii++) {
        expect(result[ii].x).toEqual(xArr[ii]);
        expect(result[ii].y).toEqual(1);
      }
      result = TimeSeriesUtil.sample([{x: 1, y: "NaN"}], xArr, "linear");
      expect(result.length).toEqual(100);
      for (ii = 0; ii < 100; ii++) {
        expect(result[ii].x).toEqual(xArr[ii]);
        expect(result[ii].y).toEqual(0);
        expect(result[ii].originalY).toEqual("NaN");
      }
    });

    it("sample returns an array with same data if sampling to similar samples", function() {
      // Make sure that if we sample a stream to itself we get the same data.
      var xArr = TimeSeriesUtil.generateSamplePoints(1, 1001, 100);
      var timeSeries = [];
      var ii;
      for (ii = 0; ii < 100; ++ii) {
        timeSeries.push({x: xArr[ii], y: xArr[ii] * 10});
      }
      var result = TimeSeriesUtil.sample(timeSeries, xArr, "linear");
      expect(result.length).toEqual(100);
      for (ii = 0; ii < 100; ii++) {
        expect(result[ii].x).toEqual(xArr[ii]);
        expect(result[ii].y).toEqual(xArr[ii] * 10);
      }
    });

    it("sample should interpolate correctly", function() {
      var xArr = TimeSeriesUtil.generateSamplePoints(1, 1001, 100);
      var timeSeries = [];
      var ii;
      // Let's start with a simple case. Two points.
      timeSeries.push({x: 1, y: 1}, {x: 2, y: 2});

      var result = TimeSeriesUtil.sample(timeSeries, xArr, "linear");
      expect(result.length).toEqual(100);
      for (ii = 0; ii < 100; ii++) {
        expect(result[ii].x).toEqual(xArr[ii]);
        // Verify that we interpolated correctly f(x) = x;
        expect(result[ii].y).toEqual(xArr[ii]);
      }

      timeSeries = [];
      // 500 is in the middle of our sample range.
      timeSeries.push({x: 1, y: 1}, {x: 500, y: 500}, {x: 750, y: 250});
      result = TimeSeriesUtil.sample(timeSeries, xArr, "linear");
      expect(result.length).toEqual(100);
      for (ii = 0; ii < 100; ii++) {
        expect(result[ii].x).toEqual(xArr[ii]);
        if (ii < 50) {
          // Verify that we interpolated correctly f(x) = x
          expect(result[ii].y).toEqual(xArr[ii]);
        } else {
          // Then we switch. Verify that after the middle we interpolated
          // correctly f(x) = 1000 - x
          expect(result[ii].y).toEqual(1000 - xArr[ii]);
        }
      }
    });

  });
});
