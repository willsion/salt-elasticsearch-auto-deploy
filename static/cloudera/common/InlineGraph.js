// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/Humanize"
], function(Humanize) {

return {
render: function(value, total, unit) {

  var percent = value / total;
  var priority = "priorityMed";
  if (percent > 0.8) {
    priority = "priorityHigh";
  }
  if (percent < 0.2) {
    priority = "priorityLow";
  }
  var valString = value;
  var totalString = total;
  if (unit === "bytes") {
    valString = Humanize.humanizeBytes(value);
    totalString = Humanize.humanizeBytes(total);
  }

  var $container = $("<span>"); // not included in the output.

  var $div = $("<div>");
  $div.addClass('CapacityUsage').addClass(priority);
  $div.append($("<span>").addClass('reading').text(valString + " / " + totalString));
  $div.append($("<span>").addClass('bar').css('width', ((percent * 100).toFixed(1)) + "%"));
  $div.append($("<span>").addClass('hidden filterValue').text(priority));
  $container.append($div);

  return $container.html();
}
};
});
