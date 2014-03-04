// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/cmf/include/DataTableSelectionManager",
  "cloudera/cmf/include/DataTableUtil",
  "cloudera/form/Form",
  "cloudera/Util",
  "underscore"
], function(DataTableColumnRenderer, DataTableSelectionManager, DataTableUtil, Form, Util, _) {

return function(options) {
  var tableId = "HostsTable";
  var form = new Form();
  var THROTTLE_TIMEOUT_MS = Math.max(options.hosts.length / 4, 50);
  var i = 0;
  var CHECK_COL = i++;
  var HOST_LINK_COL = i++;
  var HOST_IP_COL = i++;
  var HOST_RACK_COL = i++;
  var HOST_CDH_VERSION_COL = i++;
  var HOST_CLUSTER_COL = i++;
  var HOST_ROLES_COL = i++;
  var HOST_DISPLAY_STATUS_COL = i++;
  var HOST_HEART_BEAT_COL = i++;
  var HOST_NUM_CORES_COL = i++;
  var HOST_LOAD_AVG_COL = i++;
  var HOST_DISK_USAGE_COL = i++;
  var HOST_PHY_MEM_COL = i++;
  var HOST_VIR_MEM_COL = i++;
  var HOST_MAINTENANCE_MODE_COL = i++;
  var HOST_COMMISSION_STATE_COL = i++;
  // invisible columns must come last.
  var HOST_HEART_BEAT_DATA_COL = i++;

  var PHYS_GROUPS = [
    HOST_NUM_CORES_COL,
    HOST_DISK_USAGE_COL,
    HOST_LOAD_AVG_COL,
    HOST_PHY_MEM_COL,
    HOST_VIR_MEM_COL
  ];

  var STATE_GROUPS = [
    HOST_MAINTENANCE_MODE_COL,
    HOST_COMMISSION_STATE_COL
  ];

  var invisibleColumns = [HOST_HEART_BEAT_DATA_COL];
  if (!options.checkboxes) {
    invisibleColumns.push(CHECK_COL);
  }

  if (!options.showMM) {
    invisibleColumns.push(HOST_MAINTENANCE_MODE_COL);
  }

  if (!options.showClusters) {
    invisibleColumns.push(HOST_CLUSTER_COL);
  }

  if (!options.showRoles) {
    invisibleColumns.push(HOST_ROLES_COL);
  }

  if (options.columnGroup === "physical") {
    // Hide the maintenance mode, commission state columns.
    _.each(STATE_GROUPS, function(col) {
      invisibleColumns.push(col);
    });
  } else if (options.columnGroup === "none") {
    // Hide all the optional columns.
    _.each(STATE_GROUPS, function(col) {
      invisibleColumns.push(col);
    });
    _.each(PHYS_GROUPS, function(col) {
      invisibleColumns.push(col);
    });
  } else {
    // Hide all the columns for the physical attributes.
    _.each(PHYS_GROUPS, function(col) {
      invisibleColumns.push(col);
    });
  }

  var dataTableSettings = {
    "aaData": options.hosts,
    "bInfo": false,
    "bSortCellsTop": true,
    "bAutoWidth": false,
    "bDeferRender": true,
    "oLanguage": {
      "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
    },
    "aaSorting": [[ HOST_LINK_COL, "asc" ]],
    "aoColumnDefs": [
      { "bSortable": false, "aTargets": [CHECK_COL, HOST_DISK_USAGE_COL, HOST_LOAD_AVG_COL, HOST_PHY_MEM_COL, HOST_VIR_MEM_COL, HOST_MAINTENANCE_MODE_COL] },
      { "bVisible": false, "aTargets": invisibleColumns },
      { "iDataSort": HOST_HEART_BEAT_DATA_COL, "aTargets": [HOST_HEART_BEAT_COL] },
      { "sClass": "alignRight", "aTargets": [HOST_HEART_BEAT_COL] },
      { "sClass": "alignCenter", "aTargets": [HOST_MAINTENANCE_MODE_COL, HOST_COMMISSION_STATE_COL] },
      { "aTargets": [CHECK_COL], "fnRender": function(oObj) { return options.checkboxes ? DataTableColumnRenderer.renderCheckbox(oObj.aData.host) : ""; }},
      { "aTargets": [HOST_LINK_COL], "fnRender": function(oObj) { return options.addLinks ? DataTableColumnRenderer.renderHostLink(oObj.aData.host) : DataTableColumnRenderer.renderHost(oObj.aData.host); }},
      { "aTargets": [HOST_IP_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderIP(oObj.aData.host); }},
      { "aTargets": [HOST_RACK_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRack(oObj.aData.host); }},
      { "aTargets": [HOST_CDH_VERSION_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderCDHVersion(oObj.aData.host); }},
      { "aTargets": [HOST_CLUSTER_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderCluster(oObj.aData.host); }},
      { "aTargets": [HOST_ROLES_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRolesOnHost(oObj.aData.host); }},
      { "aTargets": [HOST_DISPLAY_STATUS_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderDisplayStatus(oObj.aData.host); }},
      { "aTargets": [HOST_HEART_BEAT_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderHeartbeat(oObj.aData.host); }},
      { "aTargets": [HOST_NUM_CORES_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderNumCores(oObj.aData.host); }},
      { "aTargets": [HOST_LOAD_AVG_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderLoadAverage(oObj.aData.host); }},
      { "aTargets": [HOST_DISK_USAGE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderDiskUsage(oObj.aData.host); }},
      { "aTargets": [HOST_PHY_MEM_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderPhysicalMemory(oObj.aData.host); }},
      { "aTargets": [HOST_VIR_MEM_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderVirtualMemory(oObj.aData.host); }},
      { "aTargets": [HOST_MAINTENANCE_MODE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderMaintenanceMode(oObj.aData.host.maintenanceMode); }},
      { "aTargets": [HOST_COMMISSION_STATE_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderCommissionState(oObj.aData.host.commissionState); }},
      { "aTargets": [HOST_HEART_BEAT_DATA_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderLastSeen(oObj.aData.host); }}
    ]
  };

  var MIN_PAGINATION_LENGTH = 10, enablePagination;
  if (options.enablePagination === undefined) {
    enablePagination = options.hosts.length > MIN_PAGINATION_LENGTH;
  } else {
    enablePagination = options.enablePagination;
  }
  DataTableUtil.initialize(tableId, dataTableSettings, enablePagination, options);

  var match = DataTableColumnRenderer.match;
  var matchCell = DataTableColumnRenderer.matchCell;
  var matchDropdown = DataTableColumnRenderer.matchDropdown;

  var $filterName = $("#filterName");
  var $filterIp = $("#filterIp");
  var $filterRack = $("#filterRack");
  var $filterCDHVersion = $("#filterCDHVersion");
  var $filterCluster = $("#filterCluster");
  var $filterRoles = $("#filterRoles");
  var $filterHostDisplayStatus = $("#filterHostDisplayStatus");
  var $filterHBeat = $("#filterHBeat");
  var $filterNumCores = $("#filterNumCores");
  var $filterDiskUsage = $("#filterDiskUsage");
  var $filterLoad = $("#filterLoad");
  var $filterPMem = $("#filterPMem");
  var $filterVMem = $("#filterVMem");
  var $filterMM = $("#filterMM");
  var $filterCommissionState = $("#filterCommissionState");

  //Handles the logic for row filtering.  Returns
  //true if a row passes all the filters and
  //should be displayed.
  $.fn.dataTableExt.afnFiltering.push(
    function( oSettings, aData, iDataIndex ) {
    if ( $(oSettings.nTable).attr("id") !== tableId ) {
      return true;
    }

    var result = true;
    // filter is turned off.
    if (options.filter !== undefined && !options.filter) {
      return result;
    }

    var notExact = false;

    var name;
    if (options.addLinks) {
      name = $(aData[HOST_LINK_COL]).html();
    } else {
      name = aData[HOST_LINK_COL];
    }

    result = match(name, $filterName.val(), notExact) &&
      matchCell(aData, HOST_IP_COL, $filterIp, notExact) &&
      matchCell(aData, HOST_RACK_COL, $filterRack, notExact) &&
      matchCell(aData, HOST_CDH_VERSION_COL, $filterCDHVersion, notExact) &&
      matchDropdown(aData, HOST_CLUSTER_COL, $filterCluster, notExact) &&
      matchDropdown(aData, HOST_ROLES_COL, $filterRoles, notExact) &&
      matchDropdown(aData, HOST_DISPLAY_STATUS_COL, $filterHostDisplayStatus, notExact) &&
      matchDropdown(aData, HOST_HEART_BEAT_COL, $filterHBeat, notExact) &&
        matchCell(aData, HOST_NUM_CORES_COL, $filterNumCores, notExact) &&
        matchDropdown(aData, HOST_DISK_USAGE_COL, $filterDiskUsage, notExact) &&
        matchCell(aData, HOST_LOAD_AVG_COL, $filterLoad, notExact) &&
        matchDropdown(aData, HOST_PHY_MEM_COL, $filterPMem, notExact) &&
        matchDropdown(aData, HOST_VIR_MEM_COL, $filterVMem, notExact) &&
        matchDropdown(aData, HOST_MAINTENANCE_MODE_COL, $filterMM, notExact) &&
        matchDropdown(aData, HOST_COMMISSION_STATE_COL, $filterCommissionState, notExact);

      return result;
    }
  );

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
    var $table = $("#" + tableId);
    $table.dataTable().fnDraw();
    $table.find(".showTooltip").tooltip();
  };

  function applyFilters(vars) {
    applyFilter(vars, "filterName");
    applyFilter(vars, "filterIp");
    applyFilter(vars, "filterRack");
    applyFilter(vars, "filterCDHVersion");
    applyFilter(vars, "filterHostDisplayStatus");
    applyFilter(vars, "filterHBeat");
    applyFilter(vars, "filterNumCores");
    applyFilter(vars, "filterDiskUsage");
    applyFilter(vars, "filterLoad");
    applyFilter(vars, "filterVMem");
    applyFilter(vars, "filterMM");
    applyFilter(vars, "filterCommissionState");
    applyFilter(vars, "filterCluster");
    redrawTable();
  }

  var throttledRedraw = Util.throttle(redrawTable, THROTTLE_TIMEOUT_MS);
  $("input.filter").keyup(throttledRedraw);
  var $filters = $(".filter");
  $filters.change(throttledRedraw);

  if (DataTableColumnRenderer.isFiltered($filters)) {
    redrawTable();
  }

  return {
    redrawTable: redrawTable,
    applyFilters: applyFilters
  };
};

});
