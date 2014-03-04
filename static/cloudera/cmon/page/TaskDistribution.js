// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

/**
 * options = {
 *   jobId: "the Job id",
 *   query: "one of the canned queries",
 *   tableUrl: "the URL where the selected task tracker table will be fetched",
 *   tableContainer: "the selector or container element of the task tracker table",
 *   heatmapContainer: "the selector or container element of the heatmap"
 * }
 */
return function(options) {

  function fillMetricRangeParameters(obj, prefix, start, end) {
    obj[prefix + ".start"] = start;
    obj[prefix + ".end"] = end;
  }

  function onCellClick(e) {
    var $target = $(e.target);
    var $td = $target.closest("td");

    var xBucketMax = $td.attr("data-x-max");
    var yBucketMax = $td.attr("data-y-max");
    var xBucketMin = $td.attr("data-x-min");
    var yBucketMin = $td.attr("data-y-min");

    var params = {
      activityName : options.jobId,
      query: options.query
    };
    fillMetricRangeParameters(params, "xRange", xBucketMin, xBucketMax);
    fillMetricRangeParameters(params, "yRange", yBucketMin, yBucketMax);

    $.get(options.tableUrl + "?" + $.param(params), function(response) {
      $(options.tableContainer).html(Util.filterError(response));
    });
  }

  $(options.heatmapContainer).on('click', 'td.value', onCellClick);
};

});
