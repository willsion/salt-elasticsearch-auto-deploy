// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "knockout"
], function(ko) {
  /**
   * options = {
   *   values: [ an array of values ]
   *   container: the DOM selector of the container element.
   * }
   */
  return function(options) {
    var viewModel;

    function Value(value) {
      this.value = ko.observable(value);

      this.removeSelf = function($this, evt) {
        viewModel.values.remove(this);
        if (evt) {
          $(evt.target).parents("tr").prev("tr").find("input[type=text]").focus();
          evt.preventDefault();
        }
      };

      this.insertBelow = function($this, evt) {
        var index = viewModel.values.indexOf(this);
        var value = viewModel.newEntry("");
        viewModel.values.splice(index + 1, 0, value);

        if (evt) {
          $(evt.target).parents("tr").next("tr").find("input[type=text]").focus();
          evt.preventDefault();
        }
      };

      this.hasSiblings = function() {
        return viewModel.values().length > 1;
      };
    }

    var values = [];
    $.each(options.values, function(i, value) {
      values.push(new Value(value));
    });

    if (values.length === 0) {
      values.push(new Value(""));
    }

    viewModel = {
      values : ko.observableArray(values),
      separator: options.separator || ",",
      newEntry: function(value) {
        return new Value(value);
      },
      applyBindings: function() {
        ko.applyBindings(this, $(options.container)[0]);
      }
    };

    return viewModel;
  };
});
