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

  var health = options.health;
  var showIcon = options.showIcon !== undefined ? options.showIcon : true;
  var showText = options.showText !== undefined ? options.showText : true;
  var roleCount = options.roleCount !== undefined ? options.roleCount : null;
  
  var s = health.text;
  if (roleCount !== null) {
    s = roleCount + " " + s;
  }

  var $container = $("<div>"); // not included in the output.
  var $span = $("<span>").addClass(health.tag + "Health");

  if (showIcon) {
    $span.append($("<span>").attr("title", s).addClass("icon"));
  }

  if (showText) {
    $span.append(s);
  }
  return $container.append($span).html();
}
};
});
