// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/I18n',
  'knockout',
  'underscore'
], function(I18n, ko, _) {

  var i18nMessages = {
    hintText: I18n.t('ui.tokenInput.hintText'),
    noResultsText: I18n.t('ui.tokenInput.noResultsText'),
    searchingText: I18n.t('ui.tokenInput.searchingText')
  };

  // Provides a bridge to the jQuery.tokenInput plugin through KnockoutJS.
  // Place this binding on an <input> element. The plugin will replace the
  // element with its own functionality. This binding requires the "value"
  // binding on the same element.
  // The "tokenize" binding takes an options object with the following options:
  // * source: (required) Either a URL to retrieve typeahead completions from
  //   or an array of possible choices.
  // * convertServerResponse: (required) Function that will take the response
  //   from the server and change it to an array of objects that look like
  //   this: {id: <string>, name: <string>}. The "id" field is 
  // * convertValue: (required) Function that takes an individual object
  // * tokenInputOptions: (optional) Object with extra options for the
  //   jQuery.tokenInput plugin itself.
  ko.bindingHandlers.tokenize = {
    init: function(element, valueAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor());
      var $element = $(element);
      var tokenInputOptions = {
        theme: 'bootstrap',
        resultsLimit: 16,
        onResult: function(serverResponse) {
          return options.convertServerResponse(serverResponse);
        }
      };
      tokenInputOptions = _.defaults(tokenInputOptions, options.tokenInputOptions, i18nMessages);
      $element.tokenInput(options.source, tokenInputOptions);

      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $element.tokenInput('cleanup');
      });
    },

    update: function(element, valueAccessor, allBindingsAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor());
      var allBindings = allBindingsAccessor();
      var $element = $(element);
      var modelValue = ko.utils.unwrapObservable(allBindings.value);
      $element.tokenInput('clear');
      if (modelValue) {
        var values = modelValue.split(',');
        _.each(values, function(value) {
          $element.tokenInput('add', options.convertValue(value));
        });
      }
    }
  };
});
