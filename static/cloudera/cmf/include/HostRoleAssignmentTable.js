// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/cmf/include/HostRoleColumnRenderer",
  "cloudera/cmf/include/DataTableUtil",
  "cloudera/Util"
], function(DataTableColumnRenderer, HostRoleColumnRenderer, DataTableUtil, Util) {

  return function(options) {
    var tableId = options.tableId;
    var THROTTLE_TIMEOUT_MS = Math.max(options.assignments.length / 4, 50);
    var assignmentColumns = [];
    var i = 0;
    var HOST_COL = i++;
    var HOST_IP_COL = i++;
    var HOST_RACK_COL = i++;
    var HOST_DISPLAY_STATUS_COL = i++;
    while (i <= HOST_DISPLAY_STATUS_COL + options.columns.length) {
      assignmentColumns.push(i);
      i++;
    }
    var NS_COL;
    if (options.showNameserviceCol) {
      NS_COL = i++;
    }
    var ROLE_COL = i++;
    var ROLE_COUNT_COL = i++;

    var invisibleColumns = [ROLE_COUNT_COL];

    var dataTableSettings = {
      "aaData": options.assignments,
      "bInfo": false,
      "bSortCellsTop": true,
      "bAutoWidth": false,
      "bDeferRender": true,
      "oLanguage": {
        "sLengthMenu": DataTableColumnRenderer.getPaginationMenu()
      },
      "aaSorting": [[ HOST_COL, "asc" ]],
      "aoColumnDefs": [
        { "bVisible": false, "aTargets": invisibleColumns },
        { "iDataSort": ROLE_COUNT_COL, "aTargets": [ROLE_COL] },
        { "aTargets": [HOST_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderHost(oObj.aData.host); }},
        { "aTargets": [HOST_IP_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderIP(oObj.aData.host); }},
        { "aTargets": [HOST_RACK_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderRack(oObj.aData.host); }},
        { "aTargets": [HOST_DISPLAY_STATUS_COL], "fnRender": function(oObj) { return DataTableColumnRenderer.renderDisplayStatus(oObj.aData.host); }},
        { "aTargets": [ROLE_COL], "fnRender": function(oObj) { return HostRoleColumnRenderer.renderRoles(oObj.aData.host); }},
        { "aTargets": [ROLE_COUNT_COL], "fnRender": function(oObj) { return HostRoleColumnRenderer.renderRoleCount(oObj.aData.host); }}
      ]
    };

    $.each(options.columns, function(i, columnName) {
      dataTableSettings.aoColumnDefs.push({
        "aTargets" : [assignmentColumns[i]],
        "fnRender" : function(oObj) {
          return HostRoleColumnRenderer.renderAssignment(columnName, oObj.aData.host, options.nameservice, options.enableHA);
        }
      });
    });

    dataTableSettings.aoColumnDefs.push({
      "bSortable" : false,
      "aTargets" : assignmentColumns
    });

    dataTableSettings.aoColumnDefs.push({
      "sClass" : "alignCenter cellSelectable",
      "aTargets" : assignmentColumns
    });

    if (NS_COL) {
      dataTableSettings.aoColumnDefs.push({
        "aTargets": [NS_COL],
        "fnRender": function(oObj) {
          return HostRoleColumnRenderer.renderNameservices(oObj.aData.host);
        }
      });
    }


    var MIN_PAGINATION_LENGTH = 10;
    var enablePagination = options.assignments.length > MIN_PAGINATION_LENGTH;
    var table = DataTableUtil.initialize(tableId, dataTableSettings, enablePagination, options);

    var match = DataTableColumnRenderer.match;
    var matchCell = DataTableColumnRenderer.matchCell;
    var matchDropdown = DataTableColumnRenderer.matchDropdown;

    var $filterName = $("#filterName");
    var $filterIp = $("#filterIp");
    var $filterRack = $("#filterRack");
    var $filterHostDisplayStatus = $("#filterHostDisplayStatus");
    var $filterNameservices = $("#filterNameservices");
    var $filterOtherRoles = $("#filterOtherRoles");

    //Handles the logic for row filtering.  Returns
    //true if a row passes all the filters and
    //should be displayed.
    $.fn.dataTableExt.afnFiltering.push(function( oSettings, aData, iDataIndex ) {
      if ( $(oSettings.nTable).attr("id") !== tableId ) {
        return true;
      }

      var result = true;
      // filter is turned off.
      if (options.filter !== undefined && !options.filter) {
        return result;
      }

      var notExact = false;

      result = matchCell(aData, HOST_COL, $filterName, notExact) &&
        matchCell(aData, HOST_IP_COL, $filterIp, notExact) &&
        matchCell(aData, HOST_RACK_COL, $filterRack, notExact) &&
        matchDropdown(aData, HOST_DISPLAY_STATUS_COL, $filterHostDisplayStatus, notExact) &&
        matchCell(aData, NS_COL, $filterNameservices, notExact) &&
        matchCell(aData, ROLE_COL, $filterOtherRoles, notExact);
      return result;
    });

    var redrawTable = function() {
      $("#" + tableId).dataTable().fnDraw();
    };

    var throttledRedraw = Util.throttle(redrawTable, THROTTLE_TIMEOUT_MS);
    $("input.filter").keyup(throttledRedraw);
    $(".filter").change(throttledRedraw);

    var toggleHoverClass = function(evt, isAdd) {
      var $target = $(evt.target);
      if (!$target.is(".cellSelectable")) {
        $target = $target.closest("td");
      }
      if ($target.find("input").length > 0) {
        if (isAdd) {
          $target.addClass("hoverable");
        } else {
          $target.removeClass("hoverable");
        }
      }
    };

    var clickInput = function(evt) {
      var $input, $target = $(evt.target);
      if ($target.is("input")) {
        return;
      }
      $input = $target.find("input");
      $input.trigger("click");
    };

    var publishSelectHostAssignment = function(evt) {
      var $input = $(evt.target);
      $.publish("selectHostAssignment", [$input.attr("name"), $input.attr("value"), $input.is(':checked')]);
    };

    $("#" + tableId).on('click', "td.cellSelectable", function(evt) {
      clickInput(evt);
    });

    $("#" + tableId).on('change', "td.cellSelectable input", function(evt) {
      publishSelectHostAssignment(evt);
    });

    $("#" + tableId).on('mouseover', "td.cellSelectable", function(evt) {
      toggleHoverClass(evt, true);
    });

    $("#" + tableId).on('mouseout', "td.cellSelectable", function(evt) {
      toggleHoverClass(evt, false);
    });
  };
});
