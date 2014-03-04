// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/ListSelector"
], function(ListSelector) {

/**
 * Selects the visible columns for a DataTable.
 */
return function (options) {
  /**
   * options = {
   *  id: the ID of this control.
   *  tableId: the ID of the associated table.
   *  maximumCount: the maximum number of columns to display.
   *  updateUrl: the POST URL to update the selection.
   *  dialogTitle: the title of the dialog.
   *  descriptionTitle: the title of the description column.
   * };
   */
  var listSelector;
  var tableId = options.tableId;

  /**
   * Show/Hide the corresponding columns in the table.
   */
  var afterChange = function(evt, name, isSelected) {
    if (isSelected) {
      $("#" + tableId).find("th." + name)
      .removeClass("hidden")
      .end().find("td." + name)
      .removeClass("hidden");
    } else {
      $("#" + tableId).find("th." + name)
      .addClass("hidden")
      .end().find("td." + name)
      .addClass("hidden");
    }
  };

  var afterClose = function(evt) {
    jQuery.publish("unpauseAutoRefresh");
  };

  /**
   * Rebuilds the list content baed on the visibility of
   * the columns.
   */
  var beforeOpen = function(evt) {
    if ($("#" + tableId).find("tbody").length === 0) {
      return false;
    } else {
      jQuery.publish("pauseAutoRefresh");
      var entries = [];
      $("#" + tableId + " thead th").each(function(i, th) {
        var $th = $(th);
        var name = $th.attr("name");
        var category = $th.attr("data-category");
        var desc = $th.find("div").text();
        if (name) {
          var entry = {
            name: name,
            description: desc,
            category: category,
            selected: !$th.hasClass("hidden")
          };
          entries.push(entry);
        }
      });
      listSelector.setEntries(entries);
    }
    return true;
  };

  var opts = {
    'id': options.id,
    'entries': [], // This is empty because we are populating the values
    'updateUrl': options.updateUrl,
    'afterChange': afterChange,
    'afterClose': afterClose,
    'beforeOpen': beforeOpen,
    'showSearch': true,
    'dialogTitle': options.dialogTitle,
    'descriptionTitle': options.descriptionTitle
  };

  listSelector = new ListSelector(opts);
};

});
