// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore',
  'cloudera/common/I18n',
  // Below this line, we don't need named references in the code.
  'select2'
], function(ko, _, I18n) {

  var formatI18nMessage = function(key) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('ui.select2.' + key);
      return I18n.t.apply(I18n, args);
    };
  };

  var i18nMessages = {
    formatNoMatches: formatI18nMessage('noMatches'),
    formatSearching: formatI18nMessage('searching'),
    formatInputTooShort: formatI18nMessage('inputTooShort'),
    formatSelectionTooBig: formatI18nMessage('selectionTooBig'),
    formatLoadMore: formatI18nMessage('loadMore')
  };

  // Use this binding to enable the select2 jQuery plugin on an element.
  //
  // There are two primary setups this binding supports:
  // * a <select> element.
  // * a <input type="hidden"> element.
  //
  // Pass the same object you would pass to select2 for config. Use the
  // existing KnockoutJS bindings to propogate the values back to the
  // view model.
  ko.bindingHandlers.select2 = {
    init: function(element, valueAccessor) {
      var options = valueAccessor();
      // I18n select2's messages.
      _.defaults(options, i18nMessages);
      // Turn on select2.
      $(element).select2(options);

      // Clean up after ourselves if the node is removed.
      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $(element).select2('destroy');
      });
    },

    update: function(element) {
      $(element).trigger('change');
    }
  };
});
