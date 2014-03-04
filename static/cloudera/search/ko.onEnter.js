// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {
  ko.bindingHandlers.onEnter = {
    init: function(element, valueAccessor) {
      var callback = valueAccessor();
      $(element).on('keypress', function(e) {
        if (e.which === 13) {
            $(e.target).blur();
            callback();
            return false;
        }
        return true;
      });
    }
  };
});