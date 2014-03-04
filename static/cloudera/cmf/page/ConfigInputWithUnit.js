// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
/**
 * JavaScript that interacts with the List values on the Config page.
 */
define([
  "knockout"
], function(ko) {
  return {
    initialize: function($container, viewModel) {
      try {
        var container = $container[0];
        $.data(container, "viewModel", viewModel);
        ko.applyBindings(viewModel, container);
      } catch (ex) {
        console.log(ex);
      }
    },

    onInputWithUnitBeforeSubmit: function($container) {
      var buf = [];
      var viewModel = $.data($container[0], "viewModel");
      if (viewModel) {
        $container.find(".inputWithUnit").val(viewModel.newValue());
      }
    }
  };
});
