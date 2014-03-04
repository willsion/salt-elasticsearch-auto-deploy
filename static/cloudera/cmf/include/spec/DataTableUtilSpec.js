// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableUtil"
], function(DataTableUtil) {

  describe("DataTableUtil Tests", function() {
    var $table = "<table><thead><tr><th><div /></th></tr></thead></table";
    var check = function(column, invisibleColumns, expected) {
      var actual = DataTableUtil.computeRealColumn(column, invisibleColumns);
      expect(actual).toEqual(expected);
    };

    it("should computeRealColumn test 1", function() {
      // since the first two columns are hidden, the 2nd visible column
      // should be the 4th column.
      check(2, [0, 1], 4);
    });

    it("should computeRealColumn test 2", function() {
      // since two columns are hidden, the 3rd visible column
      // should be the 5th column.
      // 0 1 [2] 3 [4] 5
      check(3, [2, 4], 5);
    });

    it("should computeRealColumn test 3", function() {
      // since two columns are hidden, but one is too far out,
      // the 3rd visible column should be the 4th column.
      // 0 1 [2] 3 4 5 [6]
      check(3, [2, 6], 4);
    });

    it("should computeRealColumn test 4", function() {
      // since two columns are hidden, the 3rd visible column
      // should be the 5th column.
      // 0 1 [2] 3 [4] 5
      // This one is tricky, because we cannot bypass the first
      // invisibleColumn even though it seemd irrelevant.
      check(3, [4, 2], 5);
    });

    it("should computeRealColumn test 5", function() {
      // since no columns are hidden, the 3rd visible column
      // should be the 3rd column.
      check(3, [], 3);
    });

    it("should computeRealColumn test 6", function() {
      // the only invisible column is too far to the right, so the 3rd visible column
      // should be the 3rd column.
      check(3, [6], 3);
    });

    it("should computeRealColumn test 7", function() {
      // the only invisible column is on the spot, our column
      // must be the next one.
      check(3, [3], 4);
    });

    it("should test updateDefaultSort", function() {
      var userSettings = {
        defaultSort: [3, "desc"],
        pageLength: 30
      };

      var dataTableSettings = {
        "bInfo": false,
        "bSortCellsTop": true,
        "bAutoWidth": false,
        "bDeferRender": true,
        "aaSorting": [[ 2, "asc" ]],
        "aoColumnDefs": [
          { "bVisible": false, "aTargets": [0, 1] },
          { "sClass": "alignCenter", "aTargets": [] }
        ]
      };

      DataTableUtil.updateDefaultSort(dataTableSettings, userSettings);
      var aSorting = dataTableSettings.aaSorting[0];
      // 3rd visible column corresponds to the 5th column including
      // hidden columns: [0], [1], 2, 3, 4, 5
      expect(aSorting[0]).toEqual(5);
      expect(aSorting[1]).toEqual("desc");
    });
  });
});
