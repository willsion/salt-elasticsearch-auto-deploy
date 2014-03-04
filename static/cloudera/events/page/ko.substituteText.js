// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
    'knockout',
    'underscore'
], function(ko, _) {

  // Using angle brackets in a Jamon template seriously confuses Jamon.
  // These template settings tell underscore to use template tags that
  // look more like HandlebarsJS: {{ variableGoesHere }}
  var templateSettings = {
    interpolate: /\{\{\W*(\w+?)\W*\}\}/g
  };

  // The text specified as the value will be written in to the element.
  // Any instances of textSubstitueValue will be replaced with the template
  // given to the binding. The template will be rendered with the dict passed
  // as substituteTextDict.
  ko.bindingHandlers.substituteText = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var $element = $(element);
      var content = valueAccessor();
      var allBindings = allBindingsAccessor();
      var value = allBindings.substituteTextValue;
      var template = _.template($element.html(), {
        value: value
      }, templateSettings);
      var substitution = new RegExp(value, 'g');
      var text = content.replace(substitution, template);
      $element.html(text);
    }
  };
});
