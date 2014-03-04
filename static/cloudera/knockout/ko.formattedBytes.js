// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/common/Humanize',
  'underscore'
], function(ko, Humanize, _) {
  function createFormattedBytesAccessor(bytes) {
    return function() {
      var unwrappedBytes = ko.utils.unwrapObservable(bytes);
      return Humanize.humanizeBytes(unwrappedBytes || 0);
    };
  }
  // Defines a binding to humanize byte strings.
  ko.bindingHandlers.formattedBytes = {
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers.text.update(element, createFormattedBytesAccessor(valueAccessor()), allBindingsAccessor, viewModel, bindingContext);
    }
  };
});
