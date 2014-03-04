// Copyright (c) 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/cmf/include/DataTableSelectionManager",
  "cloudera/cmf/include/DataTableUtil",
  "cloudera/Util",
  "underscore"
], function(DataTableColumnRenderer, DataTableSelectionManager, DataTableUtil, Util, _) {

/*
 * Creates a Flume channels table
 */
return function(channelsOptions, sinksOptions, sourcesOptions) {
  var channelsTableId = "ChannelsTable";
  var sourcesTableId = "SourcesTable";
  var sinksTableId = "SinksTable";
  var THROTTLE_TIMEOUT_MS = Math.max(channelsOptions.channels.length / 4, 50);

  var matchCell = DataTableColumnRenderer.matchCell;
  var notExact = false;

  var round = function(value, digits) {
    if (Util.isDefined(value)) {
      return value.toFixed(digits);
    }
    return "-";
  };

  // We want null values to sort largest, for "time till full" column.
  function numericNullLargestConverter(a) {
    if (typeof(a) === "number") {
      return a;
    }
    if (a === undefined || a === null || a === "-") {
      return Number.MAX_VALUE;
    }
    return Number(a);
  }

  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "numeric-null-largest-pre": function(a) {
      return numericNullLargestConverter(a);
    },
    "numeric-null-largest-asc": function(a, b) {
      a = numericNullLargestConverter(a);
      b = numericNullLargestConverter(b);
      return (a < b) ? -1 : (a === b ? 0 : 1);
    },
    "numeric-null-largest-desc": function(a, b) {
      a = numericNullLargestConverter(a);
      b = numericNullLargestConverter(b);
      return (a < b) ? 1 : (a === b ? 0 : -1);
    }
  });

  /*
   * Configure the channels table
   */
  var channelsTableSetup = function() {
    var i = 0;
    var ROLE_NAME_COL = i++;
    var ROLE_LINK_COL = i++;
    var COMPONENT_COL = i++;
    var CHANNEL_CAPACITY = i++;
    var CHANNEL_SIZE = i++;
    var CHANNEL_SIZE_PERCENT = i++;
    var CHANNEL_SIZE_CHANGE = i++;
    var CHANNEL_TIME_TILL_FULL = i++;
    var CHANNEL_PUT_SUCCESS = i++;
    var CHANNEL_PUT_UNCOMMITTED = i++;
    var CHANNEL_TAKE_SUCCESS = i++;

    var $filterRole = $("#filterChannelRole");
    var $filterComponent = $("#filterChannelComponent");
    var tableSel = "#" + channelsTableId;

    $.fn.dataTableExt.afnFiltering.push(
      function(oSettings, aData, iDataIndex) {
        if ($(oSettings.nTable).attr("id") !== channelsTableId) {
          return true;
        }
        var result = true;
        result = matchCell(aData, ROLE_NAME_COL, $filterRole, notExact) &&
            matchCell(aData, COMPONENT_COL, $filterComponent, notExact);
        return result;
      }
    );

    var redraw = function() {
      $(tableSel).dataTable().fnDraw();
    };

    var throttledRedraw = Util.throttle(redraw, THROTTLE_TIMEOUT_MS);

    var tableSetting = {
      "aaData": channelsOptions.channels,
      "bInfo": false,
      "bSortCellsTop": true,
      "bAutoWidth": false,
      "bDeferRender": true,
      "oLanguage": {
        "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
      },
      "sDom": '<"toolbar"ipl>rt<"clear">',
      "aaSorting": [[ CHANNEL_TIME_TILL_FULL, "asc" ]],
      "aoColumnDefs": [
        { "bSortable": false, "aTargets": [] },
        { "bVisible": false, "aTargets": [ROLE_NAME_COL] },
        { "aTargets": [ROLE_LINK_COL], "fnRender": function(oObj) {
            return DataTableColumnRenderer.renderIconLink(oObj.aData[ROLE_LINK_COL], oObj.aData[ROLE_NAME_COL], ""); }},
        { "aTargets": [CHANNEL_TIME_TILL_FULL],
          "sClass": "alignRight",
          "sType": "numeric-null-largest",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 0); }},
        { "aTargets": [CHANNEL_CAPACITY, CHANNEL_SIZE, CHANNEL_SIZE_CHANGE, CHANNEL_SIZE_PERCENT, CHANNEL_PUT_UNCOMMITTED],
          "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 0); }},
        { "aTargets": [CHANNEL_PUT_SUCCESS, CHANNEL_TAKE_SUCCESS],
          "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 1); }}
      ]
    };

    return {
      'oSetting': tableSetting,
      'redraw': redraw,
      'throttledRedraw': throttledRedraw,
      'tableSel': tableSel
    };
  };

  /*
   * Configure the sinks table
   */
  var sinksTableSetup = function() {
    var i = 0;
    var ROLE_NAME_COL = i++;
    var ROLE_LINK_COL = i++;
    var COMPONENT_COL = i++;
    var DRAIN_SUCCESS = i++;
    var DRAIN_UNCOMMITTED = i++;
    var CONN_FAILURES = i++;

    var $filterRole = $("#filterSinkRole");
    var $filterComponent = $("#filterSinkComponent");
    var tableSel = "#" + sinksTableId;

    $.fn.dataTableExt.afnFiltering.push(
      function(oSettings, aData, iDataIndex) {
        if ($(oSettings.nTable).attr("id") !== sinksTableId) {
          return true;
        }
        var result = true;
        result = matchCell(aData, ROLE_NAME_COL, $filterRole, notExact) &&
            matchCell(aData, COMPONENT_COL, $filterComponent, notExact);
        return result;
      }
    );

    var redraw = function() {
      $(tableSel).dataTable().fnDraw();
    };

    var throttledRedraw = Util.throttle(redraw, THROTTLE_TIMEOUT_MS);

    var tableSetting = {
      "aaData": sinksOptions.sinks,
      "bInfo": false,
      "bSortCellsTop": true,
      "bAutoWidth": false,
      "bDeferRender": true,
      "oLanguage": {
        "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
      },
      "sDom": '<"toolbar"ipl>rt<"clear">',
      "aaSorting": [[ CONN_FAILURES, "desc" ]],
      "aoColumnDefs": [
        { "bSortable": false, "aTargets": [] },
        { "bVisible": false, "aTargets": [ROLE_NAME_COL] },
        { "aTargets": [ROLE_LINK_COL], "fnRender": function(oObj) {
          return DataTableColumnRenderer.renderIconLink(oObj.aData[ROLE_LINK_COL], oObj.aData[ROLE_NAME_COL], ""); }},
        { "aTargets": [DRAIN_UNCOMMITTED, CONN_FAILURES], "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 0); }},
        { "aTargets": [DRAIN_SUCCESS], "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 1); }}
      ]
    };

    return {
      'oSetting': tableSetting,
      'redraw': redraw,
      'throttledRedraw': throttledRedraw,
      'tableSel': tableSel
    };
  };

  /*
   * Configure the sources table
   */
  var sourcesTableSetup = function() {
    var i = 0;
    var ROLE_NAME_COL = i++;
    var ROLE_LINK_COL = i++;
    var COMPONENT_COL = i++;
    var EVENT_RECEIVE_SUCCESS = i++;
    var EVENT_RECEIVE_UNCOMMITTED = i++;

    var $filterRole = $("#filterSourceRole");
    var $filterComponent = $("#filterSourceComponent");
    var tableSel = "#" + sourcesTableId;

    $.fn.dataTableExt.afnFiltering.push(
      function(oSettings, aData, iDataIndex) {
        if ($(oSettings.nTable).attr("id") !== sourcesTableId) {
          return true;
        }
        var result = true;
        result = matchCell(aData, ROLE_NAME_COL, $filterRole, notExact) &&
            matchCell(aData, COMPONENT_COL, $filterComponent, notExact);
        return result;
      }
    );

    var redraw = function() {
      $(tableSel).dataTable().fnDraw();
    };

    var throttledRedraw = Util.throttle(redraw, THROTTLE_TIMEOUT_MS);

    var tableSetting = {
      "aaData": sourcesOptions.sources,
      "bInfo": false,
      "bSortCellsTop": true,
      "bAutoWidth": false,
      "bDeferRender": true,
      "oLanguage": {
        "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
      },
      "sDom": '<"toolbar"ipl>rt<"clear">',
      "aaSorting": [[ EVENT_RECEIVE_UNCOMMITTED, "desc" ]],
      "aoColumnDefs": [
        { "bSortable": false, "aTargets": [] },
        { "bVisible": false, "aTargets": [ROLE_NAME_COL] },
        { "aTargets": [ROLE_LINK_COL], "fnRender": function(oObj) {
          return DataTableColumnRenderer.renderIconLink(oObj.aData[ROLE_LINK_COL], oObj.aData[ROLE_NAME_COL], ""); }},
        { "aTargets": [EVENT_RECEIVE_SUCCESS], "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 1); }},
        { "aTargets": [EVENT_RECEIVE_UNCOMMITTED], "sClass": "alignRight",
          "fnRender": function(oObj, val) {
            return round(oObj.aData[oObj.iDataColumn], 0); }}
      ]
    };

    return {
      'oSetting': tableSetting,
      'redraw': redraw,
      'throttledRedraw': throttledRedraw,
      'tableSel': tableSel
    };
  };

  /*
   * Init the datatables
   */
  var MIN_PAGINATION_LENGTH = 10;

  var channelsCtrl = channelsTableSetup();
  var sinksCtrl = sinksTableSetup();
  var sourcesCtrl = sourcesTableSetup();

  DataTableUtil.initialize(
      channelsTableId,
      channelsCtrl.oSetting,
      channelsOptions.channels.length > MIN_PAGINATION_LENGTH,
      channelsOptions);
  DataTableUtil.initialize(
      sinksTableId,
      sinksCtrl.oSetting,
      sinksOptions.sinks.length > MIN_PAGINATION_LENGTH,
      sinksOptions);
  DataTableUtil.initialize(
      sourcesTableId,
      sourcesCtrl.oSetting,
      sourcesOptions.sources.length > MIN_PAGINATION_LENGTH,
      sourcesOptions);

  /*
   * Handle filtering
   */
  function applyOneFilter(vars, name) {
    if (vars[name] !== undefined) {
      $("#" + name).val(vars[name]);
    }
  }

  var redrawTables = function() {
    $(channelsCtrl.tableSel).dataTable().fnDraw();
    $(sinksCtrl.tableSel).dataTable().fnDraw();
    $(sourcesCtrl.tableSel).dataTable().fnDraw();
  };

  function applyFilters(vars) {
    applyOneFilter(vars, "filterChannelRole");
    applyOneFilter(vars, "filterChannelComponent");
    applyOneFilter(vars, "filterSinkRole");
    applyOneFilter(vars, "filterSinkComponent");
    applyOneFilter(vars, "filterSourceRole");
    applyOneFilter(vars, "filterSourceComponent");
    redrawTables();
  }

  _.each([channelsCtrl, sinksCtrl, sourcesCtrl], function(ctrl) {
    $(ctrl.tableSel + " input.filter").keyup(ctrl.throttledRedraw);
    $(ctrl.tableSel + " .filter").change(ctrl.throttledRedraw);
  });

  /*
   * Data refresh handling
   */
  function reloadOneTable(tableCtrl, data) {
    var oTable = $(tableCtrl.tableSel).dataTable();
    oTable.fnClearTable(false);
    oTable.fnAddData(data, false);
    DataTableUtil.standingRedraw(oTable);
  }

  var reloadData = function(channelsJson, sinksJson, sourcesJson) {
    reloadOneTable(channelsCtrl, channelsJson);
    reloadOneTable(sinksCtrl, sinksJson);
    reloadOneTable(sourcesCtrl, sourcesJson);
  };

  return {
    redrawTables: redrawTables,
    applyFilters: applyFilters,
    reloadData: reloadData
  };
};
});
