// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/Util",
  "cloudera/headlamp/hdfs/rwx",
  "cloudera/headlamp/hdfs/include/FileSearchResultColumnRenderer",
  "cloudera/common/I18nDataTable"
], function(DataTableColumnRenderer, Util, rwx, FileSearchResultColumnRenderer, I18nDataTable) {

  /**
   * Renders the main file search results table.
   * @param options {
   *     // the DOM id of the table.
   *     tableId : "...",
   *
   *     // the directory if we are browsing one, or empty
   *     // when performing a search.
   *     // TODO: This may change.
   *     path : "...",
   *     watchedDirsManager: // something to add or remove watched dirs.
   * }
   */
  return function(options) {
    var renderTable = function(data, initialized) {
      var tableId = options.tableId;
      var path = options.path;
      var watchedDirsManager = options.watchedDirsManager;

      var PAGE_LENGTH = 25;
      var THROTTLE_TIMEOUT_MS = 50;
      var i = 0;
      var WATCHED_DIR_COL = i++;
      var NAME_COL = i++;
      var PARENT_COL = i++;
      var OWNER_COL = i++;
      var GROUP_COL = i++;
      var PERM_COL = i++;
      var NAMESPACE_COL = i++;
      var DISKSPACE_COL = i++;
      var ACTIONS_COL = i++;
      var NAME_ONLY_COL = i++;

      var invisibleColumns = [NAME_ONLY_COL];
      var dataTableSettings = {
        "aaData": data,
        "bInfo": false,
        "bDestroy": initialized, // if initialized already, destroy it first.
        "bSortCellsTop": true,
        "bAutoWidth": false,
        "bDeferRender": true,
        "oLanguage": {
          "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
        },
        "aaSorting": [[ NAME_COL, "asc" ]],
        "aoColumnDefs": [
          { "sClass": "alignRight", "aTargets": [DISKSPACE_COL, NAMESPACE_COL] },
          { "bSortable": false, "aTargets": [DISKSPACE_COL, NAMESPACE_COL] },
          { "bVisible": false, "aTargets": invisibleColumns },
          { "aTargets": [WATCHED_DIR_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderWatchedDir(oObj.aData, watchedDirsManager);
          }},
          { "aTargets": [NAME_COL], "fnRender": function(oObj) {
            var $div = $("<span/>").addClass("hidden").addClass("data")
            .text(JSON.stringify(oObj.aData));
            return FileSearchResultColumnRenderer.renderNameHtml(oObj.aData) +
              $("<div/>").html($div).html();
          }},
          { "aTargets": [PARENT_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderParent(oObj.aData);
          }},
          { "aTargets": [OWNER_COL], "fnRender": function(oObj) {
            return Util.ensureDefined(oObj.aData.owner);
          }},
          { "aTargets": [GROUP_COL], "fnRender": function(oObj) {
            return Util.ensureDefined(oObj.aData.group);
          }},
          { "aTargets": [PERM_COL], "fnRender": function(oObj) {
            return rwx.rwx(oObj.aData.mode);
          }},
          { "aTargets": [NAMESPACE_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderNamespace(oObj.aData);
          }},
          { "aTargets": [DISKSPACE_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderDiskspace(oObj.aData);
          }},
          { "aTargets": [ACTIONS_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderActionsMenu(oObj.aData);
          }},
          { "aTargets": [NAME_ONLY_COL], "fnRender": function(oObj) {
            return FileSearchResultColumnRenderer.renderNameText(oObj.aData);
          }}
        ]
      };
      var paginationEnabled = data.length > PAGE_LENGTH;
      DataTableColumnRenderer.setPagination(dataTableSettings, paginationEnabled, PAGE_LENGTH);
      I18nDataTable.initialize(dataTableSettings);

      //initialize DataTable
      try {
        $("#" + tableId).dataTable(dataTableSettings);
      } catch (ex) {
        console.log(ex);
      }

      var match = DataTableColumnRenderer.match;
      var matchCell = DataTableColumnRenderer.matchCell;
      var matchDropdown = DataTableColumnRenderer.matchDropdown;

      var $filterPath = $("#filterPath");
      var $filterParent = $("#filterParent");
      var $filterGroup = $("#filterGroup");
      var $filterOwner = $("#filterOwner");
      var $filterPermissions = $("#filterPermissions");

      //Handles the logic for row filtering.  Returns
      //true if a row passes all the filters and
      //should be displayed.
      $.fn.dataTableExt.afnFiltering.push(
        function( oSettings, aData, iDataIndex ) {
          if ( $(oSettings.nTable).attr("id") !== tableId ) {
            return true;
          }

          var result = true;
          var notExact = false;

          result = matchCell(aData, NAME_ONLY_COL, $filterPath, notExact) &&
            matchCell(aData, PARENT_COL, $filterParent, notExact) &&
            matchCell(aData, GROUP_COL, $filterGroup, notExact) &&
            matchCell(aData, OWNER_COL, $filterOwner, notExact) &&
            matchCell(aData, PERM_COL, $filterPermissions, notExact);

          return result;
        }
      );

      var redrawTable = function() {
        $("#" + tableId).dataTable().fnDraw();
      };

      var throttledRedraw = Util.throttle(redrawTable, THROTTLE_TIMEOUT_MS);
      $("#" + tableId).find("input.filter")
        .keyup(throttledRedraw)
      .end().find(".filter")
        .change(throttledRedraw);
    };

    // Expose the render method to the outside world.
    return {
      render:renderTable
    };
  };
});
