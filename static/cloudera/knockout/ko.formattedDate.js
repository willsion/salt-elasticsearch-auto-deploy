// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'cloudera/common/Humanize',
  'underscore'
], function(ko, Humanize, _) {
  function createFormattedDateAccessor(wrappedDate, methodName) {
    return function() {
      var unwrappedDate = ko.utils.unwrapObservable(wrappedDate),
        parsedDate;
      if (unwrappedDate) {
        var date = new Date(_.isNumber(unwrappedDate) ? unwrappedDate : Date.parse(unwrappedDate));
        var method = (_.isFunction(Humanize[methodName]) ? Humanize[methodName] : Humanize.humanizeDateTimeMedium);
        parsedDate = method.call(Humanize, date);
      } else {
        parsedDate = '';
      }
      return parsedDate;
    };
  }
  // Defines a binding to humanize date strings.
  // This will handle a unix timestamp or any string parsable by Date.parse.
  // The result is a string formatted using the Humanize.humanizeDateTimeMedium.
  ko.bindingHandlers.formattedDate = {
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var allBindings = allBindingsAccessor();
      // Retrieve the method we should use to format the date.
      var formattedDateMethod = allBindings.formattedDateMethod || 'humanizeDateTimeMedium';
      return ko.bindingHandlers.text.update(
        element,
        createFormattedDateAccessor(valueAccessor(), formattedDateMethod),
        allBindingsAccessor,
        viewModel,
        bindingContext);
    }
  };
});
