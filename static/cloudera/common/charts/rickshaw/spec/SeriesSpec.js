// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/charts/rickshaw/Series'
], function(Series) {
  describe("Series Tests", function() {

    it("should interpolate the basic case", function() {
      var series = [ {
        data: [{x: 1, y: 1}, {x: 2, y: 2}]
      }, {
        data: [{x: 2, y: 2}, {x: 3, y: 3}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":1},{"x":2,"y":2},{"x":3,"y":3}],[{"x":1,"y":1},{"x":2,"y":2},{"x":3,"y":3}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

    it("should interpolate when X domain values are distinct", function() {
      var series = [ {
        data: [{x: 1, y: 1}, {x: 2, y: 2}, {x: 4, y: 10}]
      }, {
        data: [{x: 3, y: 3}, {x: 5, y: 7}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":1},{"x":2,"y":2},{"x":3,"y":6},{"x":4,"y":10},{"x":5,"y":14}],[{"x":1,"y":-1},{"x":2,"y":1},{"x":3,"y":3},{"x":4,"y":5},{"x":5,"y":7}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

    it("should interpolate array with one element but distinct points", function() {
      var series = [ {
        data: [{x: 1, y: 1}]
      }, {
        data: [{x: 2, y: 2}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":1},{"x":2,"y":1}],[{"x":1,"y":2},{"x":2,"y":2}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

    it("should not interpolate anything", function() {
      var series = [ {
        data: [{x: 1, y: 1}]
      }, {
        data: [{x: 1, y: 2}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":1}],[{"x":1,"y":2}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

    it("should not interpolate anything either", function() {
      var series = [ {
        data: [{x: 1, y: 1}, {x: 3, y: 3}]
      }, {
        data: [{x: 1, y: 2}, {x: 3, y: 4}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":1},{"x":3,"y":3}],[{"x":1,"y":2},{"x":3,"y":4}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

    it("should convert NaN to 0 and generate originalY", function() {
      var series = [ {
        data: [{x: 1, y: "NaN"}, {x: 3, y: "naN"}]
      }, {
        data: [{x: 1, y: 2}, {x: 3, y: "Nan"}]
      } ];
      var series2 = Series.interpolateFill(series);
      var expected = '[[{"x":1,"y":0,"originalY":"NaN"},' +
                       '{"x":3,"y":0,"originalY":"naN"}],' +
                      '[{"x":1,"y":2},' +
                       '{"x":3,"y":0,"originalY":"Nan"}]]';
      expect(JSON.stringify(series2)).toEqual(expected);
    });

  });
});
