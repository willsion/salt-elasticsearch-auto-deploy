// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "cloudera/Util",
  "knockout"
], function(_, Util, ko) {

  /**
   * Manages the charts type selector widget.
   *
   * options = {
   *   container: (required) "selector or element of the container object",
   *   chartType: (optional) the initial chart type
   * };
   */
  function ChartTypeSelector(options) {

    var self = this, $container = $(options.container);

    self.clickChartType = function(vm, event) {
      var $target = $(event.target);
      self.chartType($target.attr("data-value"));
      if (event) {
        event.preventDefault();
      }
    };

    self._chartType = ko.observable(options.chartType);

    self.chartType = ko.computed({
      read: function() {
        return self._chartType();
      },
      write: function(value) {
        self._chartType(value);
        $.publish("chartTypeChanged", [value]);
      }
    }, self);

    ko.applyBindings(self, $(options.container)[0]);
  }

  return ChartTypeSelector;
});
