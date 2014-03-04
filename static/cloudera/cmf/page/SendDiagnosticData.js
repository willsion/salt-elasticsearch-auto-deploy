// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/TimeUtil",
  "cloudera/Analytics"
], function(Util, Humanize, TimeUtil, analytics) {

return function(params) {

  var _endTime = params.endTime;
  var _modalId = "#" + params.modalId;

  var $toTime = $(_modalId + ' input[name="toTime"]');
  var $toTimestamp = $(_modalId + ' input[name="toTimestamp"]');

  var onSubmitForm = function(e) {
    // date in server timezone.
    var serverToDate = $toTime.datetimepicker('getDate');

    // date in local timezone.
    var toDate = TimeUtil.fromServerDate(serverToDate);

    // Timestamp is UTC, so must be sent using the local timezone.
    var toTimestampVal = toDate.getTime();

    $toTimestamp.val(toTimestampVal);
    analytics.trackEvent('Support', 'Diagnostics Data Sent');
    $(_modalId).modal("hide");
  };

  var handleError = function(message) {
    $toTime.parents(".control-group").addClass("error");
    $toTime.siblings(".help-block").html(message);
  };

  $toTime.datetimepicker({
    controlType: 'select'
  });

  // Display using server timezone.
  $toTime.datetimepicker('setDate', TimeUtil.toServerDate(new Date(_endTime)));

  $('.sendDiagnosticsButton').click(onSubmitForm);
};
});
