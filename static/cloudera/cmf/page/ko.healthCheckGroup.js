// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(["knockout"], function(ko) {

  var updateHealthCheckGroup = function(elem, group) {
    var $elem = $(elem);
    // Add classname for summary.
    $elem.addClass(group.summary + 'Health');
    // Add classname if expanded, remove if not.
    if (group.expanded()) {
      $elem.addClass('checksExpanded');
    } else {
      $elem.removeClass('checksExpanded');
    }
    // Hide if checks().length === 0, show if not.
    if (group.checks().length > 0) {
      $elem.show();
    } else {
      $elem.hide();
    }
  };

  // A custom binding used in the ServiceHealthCheckTable.jamon template and
  // meant to work with the HealthCheckGroup objects defined in
  // ServiceHealthCheckTable.js.
  ko.bindingHandlers.healthCheckGroup = {
    // <li data-bind="attr: { id: summary + 'Health' }, css: { checksExpanded: expanded() }, visible: checks().length > 0">
    init: function(element, valueAccessor) {
      updateHealthCheckGroup(element, valueAccessor());
    },

    update: function(element, valueAccessor) {
      updateHealthCheckGroup(element, valueAccessor());
    }
  };
});
