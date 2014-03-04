// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "knockout"
], function(ko) {
  /**
   * Encapsulates the state of rendering an input and a unit.
   *
   * options = {
   *   scaleOptions: [ {
   *     label: 'KiB',
   *     scale: 1024
   *   }, {
   *     ...
   *   } ],
   *   value: 1025
   * };
   */
  function InputWithUnit(options) {
    var self = this;

    self.options = ko.observableArray(options.scaleOptions);

    /**
     * Finds the index of the last scaleOption that
     * predicate(value, scaleOptions[index]) returns true.
     */
    self.getScaleOptionIndex = function(value, predicate) {
      var i, scaleOptions = options.scaleOptions, index = 0;

      if ($.isNumeric(value)) {
        for (i = 1; i < scaleOptions.length; i++) {
          if (predicate(value, scaleOptions[i])) {
            index = i;
          } else {
            index = i - 1;
            break;
          }
        }
      }
      return index;
    };

    self.initWithLargestPreciseScale = function(initValue) {
      var predicate = function(value, scaleOption) {
        return (value / scaleOption.scale) % 1 === 0;
      };
      // return the index that no rounding is necessary.
      var index = self.getScaleOptionIndex(initValue, predicate);
      if ($.isNumeric(initValue)) {
        self.numValue = ko.observable(initValue / options.scaleOptions[index].scale);
      } else {
        self.numValue = ko.observable("");
      }
      self.scale = ko.observable(options.scaleOptions[index].scale);
      self.label = ko.observable(options.scaleOptions[index].label);
    };

    self.initWithLargestPreciseScale(options.value);

    self.isInputNumeric = ko.computed(function() {
      var numValue = self.numValue();
      return $.isNumeric(numValue);
    });

    self.newValue = ko.computed(function() {
      if (self.isInputNumeric()) {
        var result = parseFloat(self.numValue(), 10) * self.scale();
        return result.toFixed(0);
      } else {
        return "";
      }
    });

    /**
     * @return the index of the scaleOptions that is best for humanize the display.
     */
    self.getHumanizedScaleIndex = ko.computed(function() {
      var predicate = function(value, scaleOption) {
        return value >= scaleOption.scale;
      };
      return self.getScaleOptionIndex(self.newValue(), predicate);
    });

    /**
     * @return the most readable display value, even though it means
     * there are some rounding effect.
     */
    self.humanizedValue = ko.computed(function() {
      if (self.isInputNumeric()) {
        var index = self.getHumanizedScaleIndex();
        var newValue = parseInt(self.newValue(), 10);
        var displayValue = newValue / options.scaleOptions[index].scale;
        if (displayValue % 1 !== 0) {
          displayValue = "≈ " + displayValue.toFixed(2);
        }
        return displayValue + " " + options.scaleOptions[index].label;
      } else {
        return "";
      }
    });

    /**
     * @return true if we should display the humanizedValue as a label.
     */
    self.isHumanizedValueVisible = ko.computed(function() {
      if (self.isInputNumeric()) {
        return self.newValue() !== '0' &&
          options.scaleOptions[self.getHumanizedScaleIndex()].scale !== self.scale();
      } else {
        return false;
      }
    });
  }

  return InputWithUnit;
});
