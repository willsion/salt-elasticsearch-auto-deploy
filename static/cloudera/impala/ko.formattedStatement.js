// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/impala/ImpalaSyntaxHighlighter',
  'knockout',
  'underscore'
], function(impalaSyntaxHighlighter, ko, _) {

  var createFormattedStatementAccessor = function(unwrappedStatement) {
    return function() {
      return impalaSyntaxHighlighter(unwrappedStatement);
    };
  };

  ko.bindingHandlers.formattedStatement = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var unwrappedStatement = ko.utils.unwrapObservable(valueAccessor());
      return ko.bindingHandlers.html.update(
        element, createFormattedStatementAccessor(unwrappedStatement),
        allBindingsAccessor, viewModel, bindingContext);
    }
  };
});