// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore",
  "knockout"
], function(_, ko) {

  /**
   * Manages the charts range (Y Axis) selector widget.
   *
   * options = {
   *   container: (required) "selector or element of the container object",
   *   min:       (optional) the min value or empty,
   *   max:       (optional) the max value or empty.
   * };
   */
  function ChartRangeSelector(options) {

    var self = this, $container = $(options.container);

    self.min = ko.observable(options.min);
    self.max = ko.observable(options.max);

    self.parse = function(value) {
      value = $.trim(value);
      if (_.isEmpty(value)) {
        // Empty strings means we should
        // remove the attribute.
        return undefined;
      } else {
        return parseFloat(value);
      }
    };

    self.isValid = function(value) {
      // Cannot be NaN, must be a number or empty string.
      return !_.isNaN(value) && (_.isNumber(value) || _.isEmpty(value));
    };

    // This method is called to update the range values manually when 
    // user provides new values via the url
    self.update = function(min, max) {
      self.min(min);
      self.max(max);
      self.apply();
    };

    self.apply = function() {
      var min = self.parse(self.min());
      var max = self.parse(self.max());
      if (self.isValid(min) && self.isValid(max)) {
        $.publish("chartRangeChanged", [min, max]);
      }
    };

    ko.applyBindings(self, $(options.container)[0]);
  }

  return ChartRangeSelector;
});
