// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/common/charts/include/TimeSeriesUtil"
], function(_, TimeSeriesUtil) {

  // After several experiments with Chrome and Firefow it seems that they
  // perform well enough with 50K on a chart.
  var MAX_POINTS_ON_CHART = 50000; // 50K points.

  var getPointsPerStream = function(streamsNum, chartWidth) {
    var totalPoints = Math.min(streamsNum * chartWidth,
                               MAX_POINTS_ON_CHART);
    return Math.floor(totalPoints / streamsNum);
  };

  var getFirstX = function(stream) {
    return stream.data[0].x;
  };

  var getLastX = function(stream) {
    return stream.data[stream.data.length - 1].x;
  };

  var getSampleSource = function(ts) {
    var sampleFrom = ts.data;
    if (ts.originalData !== undefined) {
      sampleFrom = ts.originalData;
    }
    return sampleFrom;
  };

  var getStreamLength = function(ts) {
    return ts.data.length;
  };

  /**
   * See comment below.
   */
  var shouldSampleStreams = function(groupTs, pointsPerStream, chartWidth) {
    if (!groupTs || groupTs.length === 0) {
      return false;
    }
    var maxNumberOfPoints = Math.max.apply(null, groupTs.map(getStreamLength));
    // If even one stream is longer than the maximum number of points per
    // stream, we need to re-sample.
    if (maxNumberOfPoints > pointsPerStream) {
      return true;
    }
    // If one stream has more points than the chart-width then we need to sample.
    if (maxNumberOfPoints > chartWidth) {
      return true;
    }
    if (groupTs.length === 1) {
      return false;
    }
    var ii, jj;
    var dix;
    var anX;
    var getDp = function(ts) {
      return ts.data[ii];
    };
    var getDix = function(ts) {
      return ts.data[ii].x;
    };
    for (ii = 0; ii < maxNumberOfPoints; ++ii) {
      dix = groupTs.filter(getDp).map(getDix);
      if (dix.length !== groupTs.length) {
        // if the number of x points is different than the number of streams
        // it means that there is a stream that is missing a point.
        return true;
      }
      anX = dix[0];
      for (jj = 1; jj < dix.length; ++jj) {
        if (dix[jj] !== anX) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * See comment below.
   */
  var sampleTimeSeriesGroup = function(groupTs, chartWidth) {
    if (!groupTs || groupTs.length === 0) {
      // nothing to do.
      return;
    }
    var sampleFrom;
    if (groupTs.length === 1) {
      //downsample
      sampleFrom = getSampleSource(groupTs[0]);
      // Keep the sample source.
      groupTs[0].originalData = sampleFrom;
      var downSampleArgs = { timeSeriesData: sampleFrom,
                             numPoints: chartWidth,
                             interpolationAlgorithm: "linear" };
      groupTs[0].data = TimeSeriesUtil.downSample(downSampleArgs);
    } else {
      // Calculate the total number of points we would have assuming each pixel
      // has a point:
      var pointsPerStream = getPointsPerStream(groupTs.length, chartWidth);
      // we assume that all streams in the group have at least one point. Empty
      // streams are filtered out. See TimeSeriesVisualizer.
      var startTime = Math.min.apply(null, groupTs.map(getFirstX));
      var endTime = Math.max.apply(null, groupTs.map(getLastX));
      if (endTime - startTime === 0) {
        // This can happen if all streams have exactly the same one point.
        // Nothing to do.
        return;
      }
      // This is being extra careful. Usually endTime - startTime is >>
      // pointsPerStream.
      pointsPerStream = Math.min(endTime - startTime, pointsPerStream);
      if (!shouldSampleStreams(groupTs, pointsPerStream, chartWidth)) {
        // Nothing to do.
        return;
      }
      var samplesX;
      if (pointsPerStream === 1) {
        // This is another improbable edge case. This can happen for example
        // if two streams have exactly one point, 1 ms apart. We will use
        // the start and end time.
        samplesX = [startTime, endTime];
      } else {
        samplesX = TimeSeriesUtil.generateSamplePoints(startTime,
                                                       endTime,
                                                       pointsPerStream);
      }
      _.each(groupTs, function(ts) {
        sampleFrom = getSampleSource(ts);
        // Keep the sample source.
        ts.originalData = sampleFrom;
        ts.data = TimeSeriesUtil.sample(sampleFrom, samplesX, "linear");
      });
    }
  };

 return {
    /**
     * The function distinguish between two cases: (1) One stream in the
     * groupTs, i.e., a single stream on a chart and (2) more than one stream
     * on a chart.
     *
     * Case (1): For this case we will down-sample the stream to the number of
     * pixels available for the chart. If a stream has fewer points than the
     * number of available pixels the stream will remain as is: no up-sampling
     * will be done. Down-sampling uses linear interpolation to generate
     * points at fix intervals.
     *
     * Case (2): For this case we have to make sure that all streams have
     * points at the same x-values. This is a requirement of rickshaw which
     * is build on top of d3 stackLayout"stacked charts".
     *
     * Another variable this function takes into account in deciding if to
     * re-sample or not is the number of points-per-stream. This number is
     * derived from the chart width, the number of streams in the group, and
     * the maximum number of points we allow per chart (currently 50K). If
     * any stream has more points than the maximum points-per-stream we
     * down-sample (by way of re-sampling) all streams.
     *
     * If all streams are already sharing the same timestamps and no
     * down-sampling is needed the streams are not re-sampled. In any other
     * case we will re-sample all streams onto the same timestamps using
     * linear interpolation.
     *
     * If needed the function will generate a new time-series stream data and
     * keep the original data in ts.originalData.
     *
     * @param groupTs An array of time-series. All time-series are assumed to
     * be non-empty.
     * @param chartWidth The width of the chart we are going to render the
     * stream onto.
     */
    sampleTimeSeriesGroup: sampleTimeSeriesGroup,

    /**
     * Visible for testing.
     *
     * Returns 'true' if the streams should be resampled, false otherwise.
     * Streams need to be sampled if there is more than one stream and the
     * streams do not align.
     *
     * @param groupTs
     * @param pointsPerStream
     * @param chartWidth
     */
    _shouldSampleStreams: shouldSampleStreams
  };
});
