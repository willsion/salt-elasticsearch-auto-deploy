// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
/**
 * JavaScript that interacts with the List values on the Config page.
 */
define([], function() {
  return {
    onInputListBeforeSubmit: function($container) {
      var buf = [];
      var viewModel = $.data($container[0], "viewModel");
      if (viewModel) {
        $.each(viewModel.values(), function(i, value) {
          buf.push(value.value());
        });
        $container.find(".hiddenInputList").val(buf.join(viewModel.separator));
      }
    }
  };
});
