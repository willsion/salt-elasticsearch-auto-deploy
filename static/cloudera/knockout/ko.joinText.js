// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {

  var TEMPLATE_KEY = 'joinText-template';

  var makeTemplateAccessor = function(template, value) {
    return function() {
      var unwrapped = ko.utils.unwrapObservable(value);
      // If we were given both a template and an array, then we have some
      // special handling to do.
      if (template && unwrapped.length) {
        return unwrapped.join(template);
      }
      // If we were not given a template, just return what we were given.
      return value;
    };
  };

  // Defines a binding to join an observable array into a single value.
  // If given a single value, it will just display that as though it were a
  // simple text binding.
  // This binding uses the innerHTML of the element it is bound to as a
  // template for joining together successive elements. If no template is given
  // it defaults to commas.
  ko.bindingHandlers.joinText = {
    init: function(element) {
      var $element = $(element);
      // Compile and store the template associated with this element.
      $element.data(TEMPLATE_KEY, $element.html());
    },

    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var template = $(element).data(TEMPLATE_KEY);
      return ko.bindingHandlers.text.update(
        element, makeTemplateAccessor(template, valueAccessor()),
        allBindingsAccessor, viewModel, bindingContext);
    }
  };

});