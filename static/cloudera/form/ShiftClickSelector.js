// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

/**
 * Provides range selection using click a checkbox, and shift click
 * another checkbox (above or below the previous one).
 *
 * All the checkboxes between the two checkboxes will be selected.
 *
 * @param options = {
 * columnIndex: 0 based column index that contains the checkboxes.
 * triggerClick: false
 * }
 */
jQuery.fn.ShiftClickSelector = function(options) {
  /**
   * @return true if a is before b.
   */
  var isBefore = function(a, b) {
    var result = false;
    var allBefores = b.prevAll();
    var i = 0, len = allBefores.length;
    for (i = 0; i < len; i += 1) {
      var $elem = $(allBefores[i]);
      if (a.is($elem)) {
        result = true;
        break;
      }
    }
    return result;
  };

  /**
   * @return true if the row is still in a table.
   */
  var isRowStillInTheTable = function($row) {
    return $row && $row.closest("table").length !== 0;
  };

  /**
   * @return the selector string for the checkboxes.
   * Note: this starts with td, so this would only pickup checkboxes
   * from tbody, those under thead would be under th.
   */
  var getCheckboxSelector = function() {
    if (Util.isDefined(options) && Util.isNumber(options.columnIndex)) {
      return "td:nth-child(" + (options.columnIndex + 1) + ") input[type=checkbox]";
    } else {
      return "td input[type=checkbox]";
    }
  };

  /**
   * @return the key to retrieve the last selection.
   */
  var getDataKey = function() {
    if (Util.isDefined(options) && Util.isNumber(options.columnIndex)) {
      return "lastSelectedRow" + options.columnIndex;
    } else {
      return "lastSelectedRow";
    }
  };

  return this.each(function(){
    var triggerClick = options && options.triggerClick;
    /**
     * Shift-click handler for checkboxes.
     */
    $(this).click(function(e) {
      var $target = $(e.target);
      if ($target.is(getCheckboxSelector())) {
        if ($target.is(":checked")) {
          // user selected a checkbox.
          var $tr = $target.closest("tr");
          if (e.shiftKey) {
            // shift-select selects everything between
            // the lastSelectedRow and $tr.
            var $lastSelectedRow = $(this).data(getDataKey());
            if (isRowStillInTheTable($lastSelectedRow)) {
              var isTrBefore = isBefore($tr, $lastSelectedRow);
              var $selectedRows;
              if (isTrBefore) {
                $selectedRows = $lastSelectedRow.prevUntil($tr);
              } else {
                $selectedRows = $tr.prevUntil($lastSelectedRow);
              }
              $selectedRows.each(function(index, selectedRow) {
                var checkbox = $(selectedRow).find(getCheckboxSelector());
                // We need to do this only on elements that
                // are not checked.
                if (!checkbox.is(":checked")) {
                  Util.setCheckboxState(checkbox, true);
                  if (triggerClick) {
                    // we need to call setCheckboxState
                    // once before and once after.
                    // otherwise, code that listens for the
                    // click event handler may get the checked
                    // state incorrectly.
                    checkbox.trigger("click");
                    Util.setCheckboxState(checkbox, true);
                  }
                }
              });
            } else {
              // previous selection is no longer
              // in the view, store the selection.
              $(this).data(getDataKey(), $tr);
            }
          } else {
            // regular select, store the selection
            $(this).data(getDataKey(), $tr);
          }
        }
      }
    });
  });
};
});
