// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/cmf/include/DataTableSelectionManager",
  "cloudera/cmf/include/DataTableUtil",
  "cloudera/Util",
  "underscore"
], function(DataTableColumnRenderer, DataTableSelectionManager, DataTableUtil, Util, _) {

/**
 * Creates a role instances table.
 * @param options: {
 *     tableId: "InstancesTable", the Id of the table (optional)
 *     roles: [{ ... }], JSON data.
 *     checkboxes: true|false,
 *     filter: true|false,
 *     showRacks: true|false,
 *     showMM: true|false,
 *     showDisplayStatus: true|false
 *     showRoleState: true|false
 *     showHealth: true|false
 * }
 * @return {
 *     redrawTable: function() {}
 *     applyFilters: function(vars) {}
 * }
 */
return function(options) {

  var tableId = options.tableId || "InstancesTable";
  var THROTTLE_TIMEOUT_MS = Math.max(options.roles.length / 4, 50);

  var i = 0;
  var CHECK_COL = i++;
  var ROLE_LINK_COL = i++;
  var ROLE_TYPE_COL = i++;
  var HOST_LINK_COL = i++;
  var HOST_COL = i++;
  var CONFIG_GROUP_COL = i++;
  var HOST_RACK_COL = i++;
  var DISPLAY_STATUS_COL = i++;
  var ROLE_STATE_COL = i++;
  var HEALTH_COL = i++;
  var ROLE_MAINTENANCE_MODE_COL = i++;
  var ROLE_COMISSION_STATE_COL = i++;

  // Called by the RowInstancesTable row filtering mechanism, this function
  // is passed an array representing the current row's data and should return
  // true to display this row in the table and false to not display it.
  var filterFunc = null;

  var setFilterFunc = function(func) {
    if (_.isFunction(func)) {
      filterFunc = func;
    }
  };

  var clearFilterFunc = function() {
    filterFunc = null;
  };

  var invisibleColumns = [ROLE_TYPE_COL, HOST_COL];
  if (!options.checkboxes) {
    invisibleColumns.push(CHECK_COL);
  }
  if (!options.showRacks) {
    invisibleColumns.push(HOST_RACK_COL);
  }
  if (!options.showDisplayStatus) {
    invisibleColumns.push(DISPLAY_STATUS_COL);
  }
  if (!options.showRoleState) {
    invisibleColumns.push(ROLE_STATE_COL);
  }
  if (!options.showHealth) {
    invisibleColumns.push(HEALTH_COL);
  }
  if (!options.showConfigGroup) {
    invisibleColumns.push(CONFIG_GROUP_COL);
  }
  if (!options.showMM) {
    invisibleColumns.push(ROLE_MAINTENANCE_MODE_COL);
  }
  if (!options.showCommissionState) {
    invisibleColumns.push(ROLE_COMISSION_STATE_COL);
  }

  if (options.roles.length === 0) {
    return;
  }
  var dataTableSettings = {


    "aaData": options.roles,
    "bInfo": false,
    "bSortCellsTop": true,
    "bAutoWidth": false,
    "bDeferRender": true,
    "oLanguage": {
      "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
    },
    "aaSorting": [[ ROLE_STATE_COL, "asc" ], [ HOST_COL, "asc" ]],
    "aoColumnDefs": [
      { "bSortable": false, "aTargets": [CHECK_COL,ROLE_TYPE_COL,HOST_COL] },
      { "bVisible": false, "aTargets": invisibleColumns },
      { "sClass": "alignCenter", "aTargets": [ROLE_MAINTENANCE_MODE_COL, ROLE_COMISSION_STATE_COL] },
      { "aTargets": [CHECK_COL], "fnRender": function(oObj) { return options.checkboxes ? DataTableColumnRenderer.renderCheckbox(oObj.aData.role) : ""; }},
      { "aTargets": [ROLE_LINK_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRoleLink(oObj.aData.role); }},
      { "aTargets": [ROLE_TYPE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRoleType(oObj.aData.role); }},
      { "aTargets": [HOST_LINK_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderHostLink(oObj.aData.host); }},
      { "aTargets": [HOST_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderHost(oObj.aData.host); }},
      { "aTargets": [CONFIG_GROUP_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderConfigGroup(oObj.aData.role); }},
      { "aTargets": [HOST_RACK_COL], "fnRender": function(oObj) { return options.showRacks ? DataTableColumnRenderer.renderRack(oObj.aData.host) : ""; }},
      { "aTargets": [DISPLAY_STATUS_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderDisplayStatus(oObj.aData.role); }},
      { "aTargets": [ROLE_STATE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRoleState(oObj.aData.role); }},
      { "aTargets": [HEALTH_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderHealth(oObj.aData.role); }},
      { "aTargets": [ROLE_MAINTENANCE_MODE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderMaintenanceMode(oObj.aData.role.maintenanceMode); }},
      { "aTargets": [ROLE_COMISSION_STATE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderCommissionState(oObj.aData.role.commissionState); }}
    ]
  };
  var MIN_PAGINATION_LENGTH = 10;
  var enablePagination = options.roles.length > MIN_PAGINATION_LENGTH;

  // $.datatable maintains some global state about its filtering functions.
  // This is inconvenient in the case where we want to destroy and then
  // re-instantiate the same datable (as in when the datatable is displayed
  // within a dialog box that is closed and then re-opened). As a workaround
  // for datatable's global state, we mark our instance's filter function with
  // the tableId we're associated with. If we find a filtering function with
  // our tableId in the array of filtering functions then we remove it before
  // adding *this* instance's rowFilter function. That way there isn't an old
  // instance's rowFilter closure still in the array of filters doing Bad Things.
  if (_.isArray($.fn.dataTableExt.afnFiltering)) {
    $.fn.dataTableExt.afnFiltering = _.reject($.fn.dataTableExt.afnFiltering, function(filter) {
      return filter.hasOwnProperty('tableId') && filter.tableId === tableId;
    });
  }

  DataTableUtil.initialize(tableId, dataTableSettings, enablePagination, options);

  var match = DataTableColumnRenderer.match;
  var matchCell = DataTableColumnRenderer.matchCell;
  var matchDropdown = DataTableColumnRenderer.matchDropdown;

  var $filterRoleType = $("#filterRoleType");
  var $filterHost = $("#filterHost");
  var $filterConfigGroup = $("#filterConfigGroup");
  var $filterRack = $("#filterRack");
  var $filterDisplayStatus  = $("#filterDisplayStatus");
  var $filterRoleState = $("#filterRoleState");
  var $filterHealth  = $("#filterHealth");
  var $filterMM = $("#filterMM");
  var $filterCommissionState = $("#filterCommissionState");

  //Handles the logic for row filtering.  Returns
  //true if a row passes all the filters and
  //should be displayed.
  var rowFilter = function(oSettings, aData, iDataIndex) {
    if ( $(oSettings.nTable).attr("id") !== tableId ) {
      return true;
    }

    var result = true;
    // filter is turned off.
    if (options.filter !== undefined && !options.filter) {
      return result;
    }
    var exact = true;
    var notExact = false;

    result = matchDropdown(aData, ROLE_TYPE_COL, $filterRoleType, exact) &&
      matchCell(aData, HOST_COL, $filterHost, notExact) &&
      (!options.showRacks || matchCell(aData, HOST_RACK_COL, $filterRack, notExact)) &&
      matchCell(aData, CONFIG_GROUP_COL, $filterConfigGroup, exact) &&
      matchDropdown(aData, DISPLAY_STATUS_COL, $filterDisplayStatus, notExact) &&
      matchDropdown(aData, ROLE_STATE_COL, $filterRoleState, notExact) &&
      matchDropdown(aData, HEALTH_COL, $filterHealth, notExact) &&
      matchDropdown(aData, ROLE_MAINTENANCE_MODE_COL, $filterMM, notExact) &&
      matchDropdown(aData, ROLE_COMISSION_STATE_COL, $filterCommissionState, notExact) &&
      (filterFunc === null || filterFunc(aData));

    return result;
  };
  rowFilter.tableId = tableId;

  //Handles the logic for row filtering.  Returns
  //true if a row passes all the filters and
  //should be displayed.
  $.fn.dataTableExt.afnFiltering.push(rowFilter);

  function applyFilter(vars, name) {
    if (vars[name] !== undefined) {
      $("#" + name).val(vars[name]);
    }
  }

  var selectionOptions = {
    tableId: tableId,
    enableActionsMenuHighlight: options.checkboxes
  };
  var manager = new DataTableSelectionManager(selectionOptions);

  var redrawTable = function() {
    manager.uncheckAll();
    $("#" + tableId).dataTable().fnDraw();
  };

  function applyFilters(vars) {
    applyFilter(vars, "filterRoleType");
    applyFilter(vars, "filterHost");
    applyFilter(vars, "filterConfigGroup");
    applyFilter(vars, "filterRack");
    applyFilter(vars, "filterDisplayStatus");
    applyFilter(vars, "filterRoleState");
    applyFilter(vars, "filterHealth");
    applyFilter(vars, "filterMM");
    applyFilter(vars, "filterCommissionState");
    redrawTable();
  }

  var getHostName = function(rowData) {
    if (_.isArray(rowData) && rowData.length >= HOST_COL) {
      return rowData[HOST_COL];
    }
    return null;
  };

  var throttledRedraw = Util.throttle(redrawTable, THROTTLE_TIMEOUT_MS);
  $("input.filter").keyup(throttledRedraw);
  var $filters = $(".filter");
  $filters.change(throttledRedraw);

  if (DataTableColumnRenderer.isFiltered($filters)) {
    redrawTable();
  }

  return {
    redrawTable: redrawTable,
    applyFilters: applyFilters,
    setFilterFunc: setFilterFunc,
    clearFilterFunc: clearFilterFunc,
    getHostName: getHostName
  };
};

});
