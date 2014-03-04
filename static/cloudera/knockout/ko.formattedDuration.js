// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/Humanize',
  'knockout'
], function(Humanize, ko) {

  var createDurationAccessor = function(duration) {
    return function() {
      var unwrappedDuration = ko.utils.unwrapObservable(duration);
      if (unwrappedDuration) {
        return Humanize.humanizeMilliseconds(duration);
      }
      return '';
    };
  };

  ko.bindingHandlers.formattedDuration = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      return ko.bindingHandlers.text.update(
        element, createDurationAccessor(valueAccessor()), allBindingsAccessor,
        viewModel, bindingContext);
    }
  };
});