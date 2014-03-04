// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * Renders a role state and an icon.
 *
 * There is an equivalent version in RoleStateAndIcon.jamon
 * for server side HTML rendering.
 */
define([], function() {
return {
  render: function(options) {

  var roleState = options.roleState;
  var showIcon = options.showIcon !== undefined ? options.showIcon : true;
  var showText = options.showText !== undefined ? options.showText : true;
  var roleCount = options.roleCount !== undefined ? options.roleCount : null;

  var s = roleState.text;
  if (roleCount !== null) {
    s = roleCount + " " + s;
  }

  var $container = $("<div>"); // not included in the output.
  var $span = $("<span>").addClass(roleState.tag + "State");

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
