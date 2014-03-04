// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {
  // Defines a binding that invokes a function when the lower scroll bound is hit.
  ko.bindingHandlers.infinitescroll = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var handler = ko.utils.unwrapObservable(valueAccessor()),
        data = {offset: 0, complete: false},
        $element = $(element);
        
      $element.scroll(data, function(event) {
        if ($element[0].scrollHeight === ($element.scrollTop() + $element.innerHeight())) {
          handler(event.data);
        }
      });
      
      handler(data);
    }
  };
});
