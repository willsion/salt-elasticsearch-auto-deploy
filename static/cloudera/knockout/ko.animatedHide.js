// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {
  ko.bindingHandlers.animatedHide = {
    update: function(element, valueAccessor) {
      var hideNow = ko.utils.unwrapObservable(valueAccessor());
      if (hideNow) {
        $(element).hide('slow');
      }
    }
  };
});