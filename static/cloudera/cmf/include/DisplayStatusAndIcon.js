// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
], function() {

/**
 * Renders health and an icon.
 *
 * There is an equivalent version in HealthAndIcon.jamon
 * for server side HTML rendering.
 */
return {
  render: function(options) {

  var displayStatus = options.displayStatus;
  var showIcon = options.showIcon !== undefined ? options.showIcon : true;
  var showText = options.showText !== undefined ? options.showText : true;
  var count = options.count !== undefined ? options.count : null;
  
  var text = displayStatus.text;
  if (count !== null) {
    text = count + " " + text;
  }

  var $container = $("<div>"); // not included in the output.
  var $span = $("<span>").addClass(displayStatus.tag + "Status");

  if (showIcon) {
    $span.append($("<span>").attr("title", text).addClass("icon"));
  }

  if (showText) {
    $span.append(text);
  }
  return $container.append($span).html();
}
};
});
