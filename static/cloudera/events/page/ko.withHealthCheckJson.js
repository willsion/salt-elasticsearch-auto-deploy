// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {

  var emptyHealthCheck = {
    error: true,
    testName: '',
    messageCodes: [],
    eventCode: ''
  };

  // This binding acts like a "with" binding, except it treats the incoming
  // data as a stringified JSON health event. If there's an error during the
  // JSON processing this will return a blank-looking health event with a
  // special error property set.
  ko.bindingHandlers.withHealthCheckJson = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      return ko.bindingHandlers['with'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },

    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var value = ko.utils.unwrapObservable(valueAccessor());
      var bound = function() {
        try {
          return JSON.parse(value);
        } catch (ex) {
          console.error('Error parsing health check JSON: %s\nHealth check JSON: %s', ex, value);
          return emptyHealthCheck;
        }
      };
      return ko.bindingHandlers['with'].update(element, bound, allBindingsAccessor, viewModel, bindingContext);
    }
  };
});