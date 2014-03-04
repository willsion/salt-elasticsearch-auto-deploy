// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/form/Form"
], function(Util, Form) {

  /**
   * Makes input boxes in the table header
   * behave like a selectAll/unselectAll.
   * options = { }
   */
  jQuery.fn.SelectAll = function(options) {
    var form = new Form();

    var getColumnNumber = function($target) {
      var $tr = $target.closest("tr"),
        $td = $target.closest("td,th"),
        columnNumber = 0;

      $tr.children().each(function(i, child) {
        if ($(child).is($td)) {
          columnNumber = i;
        }
      });
      return columnNumber;
    };

    return this.each(function() {
      $(this).on('click', "thead input[type=checkbox]", function(evt) {
        var $target = $(evt.target),
          columnNumber = getColumnNumber($target);
        // checking/unchecking a checkbox in the header should check/uncheck
        // everything in the body.
        form.setCheckedStateForTableColumn($target, columnNumber, $target.prop("checked"));
      });

      $(this).on('click', "tbody input[type=checkbox]", function(evt) {
        var $target = $(evt.target),
          columnNumber = getColumnNumber($target);
        if (!$target.is(":checked")) {
          // unchecking a checkbox should uncheck the corresponding checkbox
          // in the header. checking has no effect.
          form.setCheckedStateForTableColumnHeader($target, columnNumber, false);
        }
      });
    });
  };
});
