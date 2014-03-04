// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  'underscore'
], function(_) {

  /**
   * Calculates the Y value using the gradient method.
   */
  function getY(d, i, j, x) {
    var diy = d[i].y,
        dix = d[i].x,
        gradient = (d[j].y - diy) / (d[j].x - dix);
    if (!_.isNumber(diy)) {
      // The back-end returns "Nan" when it could not compute the
      // value of a point (e.g., "select m1 / m2" and m2 is 0). We
      // will return 0 here. Hovering over the point will let the user
      // know that this point is NaN.
      return 0;
    }
    return diy + gradient * (x - dix);
  }

  /**
   * Interpolates the ith element of the array d.
   */
  function interpolate(d, i, x) {
    if (d.length <= 1) {
      // there is only one element in the array d,
      // copy the nearest point.
      return d[0].y;
    } else if (i === 0) {
      // linear interpolate between i and i+1.
      return getY(d, i, i+1, x);
    } else if (i >= d.length - 1) {
      // linear interpoate
      // between the last two elements.
      return getY(d, d.length - 2, d.length - 1, x);
    } else {
      // linear interpolate betewen i-1 and i.
      return getY(d, i-1, i, x);
    }
  }

  return {
    /**
     * Add missing values by linear interpolation.
     * For edge points, it performs extrapolation.
     */
    interpolateFill: function(series) {

      // x will be the minimum x value from all the series at position i.
      var x, i = 0;

      // Remove all other attributes and retain the data attribute only.
      var data = series.map( function(s) {
        return s.data;
      } );

      var getLength = function(d) {
        return d.length;
      };

      var getDi = function(d) {
       return d[i];
      };

      var getDix = function(d) {
        return d[i].x;
      };

      var fixYAndAddMissingX = function(d) {
        if (d[i] && !_.isNumber(d[i].y)) {
          // The back-end returns "Nan" when it could not compute the
          // value of a point (e.g., "select m1 / m2" and m2 is 0). We
          // will return 0 here. Hovering over the point will let the user
          // know that this point is NaN.
          d[i].originalY = d[i].y;
          d[i].y = 0;
        }
        if (!d[i] || d[i].x !== x) {
          var y = interpolate(d, i, x);
          d.splice(i, 0, { x: x, y: y });
        }
      };

      // Loop to the size of the longest data array.
      while ( i < Math.max.apply(null, data.map(getLength))) {
        // Select the minimum x value from all the series.
        x = Math.min.apply(null, data.filter(getDi).map(getDix));

        // Add the y value for the corresponding x value.
        data.forEach(fixYAndAddMissingX);
        i++;
      }
      return data;
    }
  };
});
