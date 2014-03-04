// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout'
], function(ko) {
  // Defines a binding that emphasizes a substring within text when
  // displaying the text.
  // Params:
  // - emphasisText: The text that has substrings that need
  //   emphasizing.
  // - emphasisSubstring: The substring that will be replaced.
  //   The substring is case-insensitive matched.
  ko.bindingHandlers.emphasisText = {
    update: function(element, valueAccessor, allBindingsAccessor) {
      var text = ko.utils.unwrapObservable(valueAccessor());
      var allBindings = allBindingsAccessor();
      var emphasisSubstring = ko.utils.unwrapObservable(allBindings.emphasisSubstring);

      var result = text;
      if (emphasisSubstring) {
        var regex = new RegExp(emphasisSubstring, 'gi');
        // The '$&' specifies that we replace what we matched. This prevents
        // the case-insensitive match from doing things like replacing "Process
        // Server" with "process Server" because the emphasisSubstring was
        // 'process'.
        result = text.replace(regex, '<em>$&</em>');
      }

      $(element).html(result);
    }
  };
});