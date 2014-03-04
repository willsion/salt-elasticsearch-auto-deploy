// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
// A utility class for DataTable.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/common/I18nDataTable",
  "cloudera/common/SessionStorage",
  "cloudera/common/UserSettings",
  "cloudera/Util",
  "underscore"
], function(DataTableColumnRenderer, I18nDataTable, SessionStorage, UserSettings, Util, _) {

  var DataTableUtil = {
    initialize: function(tableId, dataTableSettings, enablePagination, options) {
      var basicDefault = {
        pageLength: 50
      };

      // try sessionStorage, backend version, then the default version, in this order.
      var settingsKey = options.settingsKey;
      var settings = SessionStorage.getItem(settingsKey) ||
        Util.parseJSON(options.settingsJson) ||
        options.settingsDefault || basicDefault;

      this.updateDefaultSort(dataTableSettings, settings);

      DataTableColumnRenderer.setPagination(dataTableSettings, enablePagination, settings.pageLength);
      I18nDataTable.initialize(dataTableSettings);
      // Initialize DataTable
      $("#" + tableId).dataTable(dataTableSettings);
      var $tableWrapper = $("#" + tableId + "_wrapper");

      var update = function() {
        SessionStorage.setItem(settingsKey, settings);
        UserSettings.update(settingsKey, JSON.stringify(settings));
      };

      $tableWrapper.find(".pagination").change(function(e) {
        settings.pageLength = $(e.target).val();
        update();
      });

      var updateSortColumn = function(columnNumber, direction) {
        settings.defaultSort = [columnNumber, direction];
        update();
      };

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

      $tableWrapper.find(".sorting,.sorting_desc").click(function(e) {
        var columnNumber = getColumnNumber($(e.target));
        updateSortColumn(columnNumber, "asc");
      });

      $tableWrapper.find(".sorting_asc").click(function(e) {
        var columnNumber = getColumnNumber($(e.target));
        updateSortColumn(columnNumber, "desc");
      });
    },

    standingRedraw: function(oTable) {
      var oSettings = oTable.fnSettings();
      if (oSettings.oFeatures.bServerSide === false) {
        var before = oSettings._iDisplayStart;

        oSettings.oApi._fnReDraw(oSettings);

        // iDisplayStart has been reset to zero - so lets change it back
        oSettings._iDisplayStart = before;
        oSettings.oApi._fnCalculateEnd(oSettings);
        oSettings.oApi._fnDraw(oSettings);
      }
    },

    computeRealColumn: function(column, invisibleColumns) {
      var i,
        result = column,
        sortedICs = _.sortBy(invisibleColumns, _.identity);

      for (i = 0; i < sortedICs.length; i++) {
        if (result < sortedICs[i]) {
          // the invisible column is too far out, don't care.
          // since the list is sorted.
          break;
        }
        // push our column to the right.
        result++;
      }
      return result;
    },

    /**
     * @return the list of invisible columns.
     */
    getInvisibleColumns: function(dataTableSettings) {
      var bVisibles = _.chain(dataTableSettings.aoColumnDefs)
        .filter(function(entry) {
          return (entry.bVisible !== undefined);
        }).first().value();

      if (bVisibles && $.isArray(bVisibles.aTargets)) {
        return bVisibles.aTargets;
      }
      return [];
    },

    /**
     * Updates the default sort attribute of the dataTableSettings
     * with values from user settings.
     *
     * If defaultSort does not exist in user settings, or if it
     * is not an array, then do nothing.
     */
    updateDefaultSort: function(dataTableSettings, settings) {
      if ($.isArray(settings.defaultSort) && settings.defaultSort.length === 2) {
        if (!$.isArray(dataTableSettings.aaSorting)) {
          dataTableSettings.aaSorting = [];
        }
        var invisibleColumns = this.getInvisibleColumns(dataTableSettings);
        settings.defaultSort[0] = this.computeRealColumn(settings.defaultSort[0], invisibleColumns);
        dataTableSettings.aaSorting[0] = settings.defaultSort;
      }
    }
  };

  return DataTableUtil;
});
