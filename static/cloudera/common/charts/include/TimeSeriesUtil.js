// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "underscore"
], function(_) {
// returns an object, no instantiation required.

  /**
   * A function that returns a time-series data array that does not contain
   * any points with the same timestamps. It also changes all 'NaN' to 0
   * and adds originalY property to the y value with the original y value.
   *
   * @return a newly created array with no duplicated points or null if tsData
   * is.
   */
  var normalizeStream = function(tsData) {
    if (tsData === null) {
      return null;
    }
    var ret = [];
    var ii;
    var point;
    for (ii = 0; ii < tsData.length; ii++) {
      var dix = tsData[ii].x;
      var diy = tsData[ii].y;
      point = {
        x : dix,
        y : diy
      };

      if (!_.isNumber(diy)) {
        point.originalY = diy;
        point.y = 0;
      } else if (tsData[ii].originalY !== undefined) {
        // If the original stream has a point with originalY it means
        // that we are re-normalizing a normalized stream. So let's keep
        // the originalY in our new, identical stream we produce.
        point.originalY = tsData[ii].originalY;
      }
      if (ii > 0 && tsData[ii - 1].x !== dix) {
        ret.push(point);
      } else if (ii === 0) {
        ret.push(point);
      }
    }
    return ret;
  };

  /**
   * Returns the first index of a datapoint in 'tsData' that is on or after
   * 'timestamp', starting the search from 'searchFrom'.
   *
   * @return the datapoint or -1 if none could be found.
   */
  var getIndexOfFirstDataPointAfter = function(tsData, searchFrom, timestamp) {
    if (searchFrom < 0) {
      throw new Error("searchFrom must be greater or equal to zero");
    }
    if (!tsData || tsData.length <= searchFrom) {
      return -1;
    }
    if (timestamp > tsData[tsData.length - 1].x) {
      return -1;
    }
    var ii;
    for (ii = searchFrom; ii < tsData.length; ii++) {
      if (tsData[ii].x >= timestamp) {
        return ii;
      }
    }
    return -1;
  };

  /**
   * Sample a single point stream onto the samplePoints. We will
   * generate a constant stream - i.e., all points will have the
   * value as the single point. The stream is assumed to be normalized, i.e.,
   * the function will not check and normalized NaN values.
   */
  var sampleSinglePointStream = function(tsData, samplePoints) {
    if (!tsData) {
      throw new Error("tsdata cannot be null or empty.");
    }
    var ret = [];
    var ii;
    var value = tsData[0].y;
    var point;
    for (ii = 0; ii < samplePoints.length; ii++) {
      point = {x: samplePoints[ii], y: value};
      if (tsData[0].originalY !== undefined) {
        point.originalY = tsData[0].originalY;
      }
      ret.push(point);
    }
    return ret;
  };

  /**
   * See comment down below at the "class" exposed functions.
   */
  var generateSamplePoints = function(startTime, endTime, numPoints) {
    if (!_.isNumber(startTime) || !_.isNumber(endTime) ||
        !_.isNumber(numPoints)) {
      throw new Error("Cannot pass non-number arguments to generateSamplePoints.");
    }
    // There is no point, no pun intended, to generate sample points for fewer
    // than 2 points.
    if (numPoints < 2) {
      throw new Error("Number of points must be greater than 2.");
    }
    // If the caller asked for 200 points and the duration is less than 200ms we
    // cannot possibly generate 200 points as the minimum time-unit is ms.
    if (endTime - startTime < numPoints) {
      throw new Error("Duration not long enough for requested number of points: " +
                      "startTime:" + startTime + " endTime: " + endTime);
    }

    // We have numPoints - 1 intervals.
    var numIntervals = numPoints - 1;
    var interval = (endTime - startTime) / numIntervals;
    var ii;
    var ret = [];
    ret.push(startTime);
    for (ii = 1; ii < numIntervals; ++ii) {
      ret.push(Math.floor(startTime + (ii * interval)));
    }
    ret.push(endTime);
    return ret;
  };

  /**
   * Linear interpolate a sample point using two points form tsData.
   * The function assumes that tsData was normalized.
   */
  var linearInterpolate = function(tsData,
                                   firstIndex,
                                   secondIndex,
                                   sampleX) {
    if (!tsData || tsData.length <= firstIndex || tsData.length <= secondIndex) {
      throw new Error("Illegal arguments to interpolate. tsData:" + tsData +
          " firstIndex: " + firstIndex + " secondIndex: " + secondIndex);
    }
    var xFirst = tsData[firstIndex].x;
    var yFirst = tsData[firstIndex].y;
    var xSecond = tsData[secondIndex].x;
    var ySecond = tsData[secondIndex].y;
    // The function assumes that the stream has been normalized so that
    // no two points have the same x. So xSecond cannot be equal to xFirst.
    var gradient = (ySecond - yFirst) / (xSecond - xFirst);
    return yFirst + gradient * (sampleX - xFirst);
  };

  /**
   * See below.
   */
  var linearSample = function(tsData, samplePoints, isNormalized) {
    if (tsData === null || samplePoints === null) {
      throw new Error("Arguments cannot be null");
    }
    var ret = [];
    if (tsData.length === 0 || samplePoints.length === 0) {
      return ret;
    }

    // We should not have duplicated points, but let's get rid of them
    // if we do. This will also change any NaN to 0.
    var timeSeries;
    if (isNormalized) {
      // We were called internally from downSample, no need to re-normalize
      // the stream.
      timeSeries = tsData;
    } else {
      timeSeries = normalizeStream(tsData);
    }

    if (tsData.length === 1) {
      // Special handle the one point case. This should not happen as the
      // back-end returns the time-series with padding, i.e., a point at the
      // start time and end-time.
      return sampleSinglePointStream(timeSeries, samplePoints);
    }
    // So we have at least two points.
    var ii, jj;
    var newPoint;
    var firstIndex, secondIndex;

    for (ii = 0, jj = 0; ii < samplePoints.length; ii++) {
      newPoint = {x: samplePoints[ii]};

      if (jj >= 0) {
        // When getIndexOfFirstDataPointAfter returns -1 it means that there
        // are no points in 'timeSeries' after or on newPoint.x. So we
        // only call the function if if haven't reached the end of our search.
        jj = getIndexOfFirstDataPointAfter(timeSeries, jj, newPoint.x);
      }
      if (jj === 0) {
        // The first point is after our sample point, interpolate
        // using jj and jj + 1.
        firstIndex = jj;
        secondIndex = jj + 1;
      } else if (jj !== -1) {
        // We found a point use it and its previous point to
        // interpolate.
        firstIndex = jj - 1;
        secondIndex = jj;
      } else {
        // We could not find a point that is or or after our sample. Use
        // last two points to interploate.
        firstIndex = timeSeries.length - 2;
        secondIndex = timeSeries.length - 1;
      }
      newPoint.y = linearInterpolate(timeSeries,
                                     firstIndex,
                                     secondIndex,
                                     newPoint.x);
      // If both the points we interpolated from were "corrected" from
      // originalY (e.g., NaN points) then the interpolated point inherits
      // the original Y.
      if (timeSeries[firstIndex].originalY !== undefined &&
          timeSeries[secondIndex].originalY !== undefined) {
        newPoint.originalY = timeSeries[firstIndex].originalY;
      }
      ret.push(newPoint);
    }
    return ret;
  };

  /**
   * A function that will downSample the tsData stream and return a stream
   * with at most numPoints of points. The function will sample the tsData
   * stream at regular intervals beginning from the first timestamp. If
   * the stream does not have a point for the required timestamp linear
   * interpolation will be used to calculate one. The stream returned is
   * normalized - no double points, and no y values are strings. The backend
   * returns y values like "NaN" in case it cannot calculate the value of a.
   * point.
   *
   * The function always return a new array. In case no downsampling is needed
   * a copy of the original array is returned so that callers can safely further
   * change the array returned.
   */
  var linearDownSample = function(tsData, numPoints) {
    if (numPoints < 0) {
      throw new Error("max points must be greater or equal to zero.");
    }
    var ret = [];
    if (numPoints === 0) {
      return ret;
    }
    // We should not have duplicated points, but let's get rid of them
    // if we do. This will also change any NaN to 0.
    var timeSeries = normalizeStream(tsData);
    if (timeSeries === null) {
      return null;
    } else if (timeSeries.length <= numPoints) {
      return timeSeries.slice(0);
    }

    var startTime = timeSeries[0].x;
    var endTime = timeSeries[timeSeries.length - 1].x;

    if (startTime > endTime) {
      // This should never happen as the backend returns a sorted
      // list.
      throw new Error("End-time " + endTime + " is before start time: " +
                      startTime);
    }
    // Special cases
    if (numPoints === 1) {
      ret.push(timeSeries[0]);
      return ret;
    } else if (numPoints === 2) {
      ret.push(timeSeries[0]);
      ret.push(timeSeries[1]);
      return ret;
    }
    var samplesX = generateSamplePoints(startTime, endTime, numPoints);
    return linearSample(timeSeries, samplesX, true);
  };

return {

/**
 * downSample the time series data to have at most 'numPoints' points using
 * the specified downsampling algorithm. If the stream is shorter than
 * 'numPoints' a copy of the original stream is returned.
 *
 * For example, if the caller wants 100 points  and the timeSeriesData array
 * contains 200 points the function will generate 100 points at fixed intervals
 * beginning from the start timestamp of the time-series data to the
 * end-timestamp of the time-series data.
 *
 * The streams returned by this method are normalized. The will not
 * contain any duplicated points (i.e., points with the same timestamp). Streams
 * will also not contain any non-numeric y values that the backend use to
 * denote points it could not compute a value for. The non-numeric values will
 * be replaced with '0' and the original value will be copied to 'originalY'
 * property of the point.
 *
 * args = {
 *    timeSeriesData: An array of time series data-points.
 *    numPoints: The number of points to generate.
 *    interpolationAlgorithm: The downsampling algorithm to use. Valid
 *                            algorithms are:
 *        "linear": Use linear interpolation
 * };
 */
downSample: function(args) {
  if (!args) {
    throw new Error("Invalid null or empty argument");
  }
  if (args.interpolationAlgorithm === "linear") {
    return linearDownSample(args.timeSeriesData, args.numPoints);
  } else {
    throw new Error("Unsupported downsampling algorithm " +
      args.interpolationAlgorithm);
  }
},

/**
 * Generate an array of sample points (timestamps) starting at 'startTime'
 * and ending at 'endTime' with a total of 'numPoints' points.
 *
 * @param startTime The timestamp for the first sample point.
 * @param endTime   The timestamp for the last point.
 * @param numPoints Total number of sample points to generate.
 */
generateSamplePoints: generateSamplePoints,

/**
 * Sample a stream tsData onto samplePoints. The sample function will either
 * downSample or upsample using the interpolation algorithm specified.
 *
 * The streams returned by this method are normalized. The will not
 * contain any duplicated points (i.e., points with the same timestamp). Streams
 * will also not contain any non-numeric y values that the backend use to
 * denote points it could not compute a value for. The non-numeric values will
 * be replaced with '0' and the original value will be copied to 'originalY'
 * property of the point.
 */
sample: function(timeSeriesData, samplePoints, interpolationAlgorithm) {
  if (interpolationAlgorithm === "linear") {
    return linearSample(timeSeriesData, samplePoints, false);
  } else {
    throw new Error("Unsupported sample algorithm " + interpolationAlgorithm);
  }
}

};
});
