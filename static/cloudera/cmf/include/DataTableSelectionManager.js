// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/Form",
  "cloudera/form/ShiftClickSelector",
  "cloudera/form/SelectAll",
  "cloudera/Util"
], function(Form, ShiftClickSelector, SelectAll, Util) {
  /**
   * options = {
   * tableId: tableId // the id of the data table.
   * }
   */
  var DataTableSelectionManager = function(options) {
    var getDataTableWrapper = function() {
      return $("#" + options.tableId + "_wrapper");
    };

    $("#" + options.tableId).ShiftClickSelector();
    $("#" + options.tableId).SelectAll();

    /**
     * Uncheck the .checkAll checkbox.
     */
    var uncheckAll = function() {
      Util.setCheckboxState($("thead .checkAll", getDataTableWrapper()), false);
    };

    /**
     * Uncheck checkAll on pagination.
     */
    $(".dataTables_paginate", getDataTableWrapper()).click(function(e) {
      var $target = $(e.target);
      if ($target.is(".paginate_button")) {
        uncheckAll();
      }
    });

    // uncheck checkAll when the page size dropdown changes.
    $(".dataTables_length select", getDataTableWrapper()).change(function(e) {
      uncheckAll();
    });

    if (options.enableActionsMenuHighlight) {
      // Highlight the actions menu above the table when something is selected.
      var form = new Form();
      var $table = $("#" + options.tableId);
      var $dropdown = $(".actionsMenuForSelected .dropdown-toggle");
      setInterval(function() {
        if (form.getNumCheckedInColumn($table, 0) > 0) {
          $dropdown.addClass("btn-primary");
          $dropdown.find(".icon-list-alt").addClass("icon-white");
        } else {
          $dropdown.removeClass("btn-primary");
          $dropdown.find(".icon-list-alt").removeClass("icon-white");
        }
      }, 1000);
    }

    // expose the uncheckAll function to the outside.
    return {
      uncheckAll : uncheckAll
    };
  };

  return DataTableSelectionManager;
});
