// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util"
], function(Util) {

return Class.extend({

  getNumCheckedInColumn : function(table, columnNumber) {
  /*
    Returns the number of <td> elements with checked checkboxes in
    the given table column.
  */
    var count = 0;

    $(table).find('tbody > tr > td:nth-child(' + (++columnNumber) + ') input[type=checkbox]:visible')
      .each(function(i, e) {
        if ($(e).attr("checked") === "checked") {
          count += 1;
        }
      });
    return count;
  },

  setCheckedStateForTableColumn: function(contextElement, columnNumber, isChecked) {
    this._setCheckedStateForTableColumnInSection(contextElement, columnNumber, isChecked, "tbody", 'td');
  },

  setCheckedStateForTableColumnHeader: function(contextElement, columnNumber, isChecked) {
    this._setCheckedStateForTableColumnInSection(contextElement, columnNumber, isChecked, "thead", 'th');
  },

  _setCheckedStateForTableColumnInSection: function(contextElement, columnNumber, isChecked, section, cell) {
    /*
      Set the checked state of many checkboxes in a single table column.
      contextElement is an element in column columnNumber.
    */
    $(contextElement)
      .parents('table')
      .find(section + '> tr > ' + cell + ':nth-child(' + (++columnNumber) + ') input[type=checkbox]:visible')
      .each(function(i, e) {
        if ($(e).attr('disabled') !== 'disabled') {
          Util.setCheckboxState(e, isChecked);
        }
      });
  }
});

});
