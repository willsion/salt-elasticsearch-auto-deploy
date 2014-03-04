// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/chart/TimeControlledContent",
  "cloudera/common/I18nDataTable"
], function(Util, TimeControlledContent, I18nDataTable) {

/**
 * JavaScript for the main Services Table.
 */
return function(options) {

/*
  var options = {
    showCommands: true|false,
    timestamp: timestamp,
    currentMode: currentMode,
    clusterId: clusterId,
    tableSelector: "#tableId",
    containerSelector: "#containerId",
    smonTimedOutSelector: DOM element of the smon timed out message,
    ajaxURL: "..."
  };
*/

  // Role Counts column and the Commands column are not sortable.
  var columnDefs = [{ "bSortable": false, "aTargets": [3,4,5] }];

  // Hide the commands column
  if (!options.showCommands) {
    columnDefs.push({ "bVisible": false, "aTargets": [5] });
  }

  var dataTableSettings = {
    "bSort": true,
    "bPaginate": false,
    "bFilter": false,
    "bInfo": false,
    "bAutoWidth": false,
    "aoColumnDefs": columnDefs
  };
  I18nDataTable.initialize(dataTableSettings);

  // Reactivate the data table.
  $(options.tableSelector).dataTable(dataTableSettings);

  var lastSortSettings;

  var beforeUpdate = function($filteredResponse) {
    // This must match the id of the dataTable.
    var oTable = $(options.tableSelector).dataTable();
    var oSettings = oTable.fnSettings();
    lastSortSettings = oSettings.aaSorting;
    oTable.fnDestroy();
    return $filteredResponse;
  };

  var MENU_ITEM_HEIGHT = 26;
  var DIVIDER_ITEM_HEIGHT = 20;

  var updateDropdownOrientation = function() {
    var $table = $(options.tableSelector);
    var maxHeight = $(document).height();
    $.each($table.find(".serviceCommands"), function(i, elem) {
      var $elem = $(elem);
      var $menuEntries = $elem.find(".dropdown-menu li");
      var $dividers = $elem.find(".dropdown-menu li.divider");
      var menuHeight = ($menuEntries.length - $dividers.length) * MENU_ITEM_HEIGHT
        + $dividers.length * DIVIDER_ITEM_HEIGHT;
      if ($elem.offset().top + $elem.height() + menuHeight > maxHeight) {
        $elem.addClass("dropup");
      } else {
        $elem.removeClass("dropup");
      }
    });
  };

  var afterUpdate = function() {
    var $table = $(options.tableSelector);
    $table.dataTable(dataTableSettings).fnSort(lastSortSettings);
    updateDropdownOrientation();
    var getTimedOut = $table.find(".smon-timed-out-state").text();
    if (getTimedOut === "true") {
      $(options.smonTimedOutSelector).show();
    } else {
      $(options.smonTimedOutSelector).hide();
    }
  };

  $(window).resize(Util.throttle(updateDropdownOrientation, 500));

  var opts = {
    urlParams: {
      timestamp: options.timestamp,
      clusterId: options.clusterId,
      currentMode: options.currentMode
    },
    beforeUpdate: beforeUpdate,
    afterUpdate: afterUpdate,
    updateOnPageLoad: false,
    url: options.ajaxURL,
    containerSelector: options.containerSelector
  };
  var timeControlledContent = new TimeControlledContent(opts);
};

});
