// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "underscore"
], function(_) {

  /**
   * options = {
   *   element: (required) "DOM selector of the element",
   *   min:     (required) the minimum value on the slider,
   *   max:     (required) the maximum value on the slider,
   *   callback:(required) a function to call back.
   *   step:    (optional) # of pixels in the grid to snap to.
   * }
   */
  return function(options) {
    var self = this, scale = options.scale;

    if (scale < options.min) {
      scale = options.min;
    }

    if (scale > options.max) {
      scale = options.max;
    }

    self.slide = function(event, ui) {
      var value = ui.value;
      if (value < options.min || value > options.max) {
        throw "scale out of range: " + value;
      }
      if (_.isFunction(options.callback)) {
        options.callback(value);
      }
    };

    var sliderOptions = {
      min: options.min,
      max: options.max,
      value: scale,
      step: options.step,
      slide: self.slide
    };

    $(options.element).slider(sliderOptions);

    return this;
  };
});
