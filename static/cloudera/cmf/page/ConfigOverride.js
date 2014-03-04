// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/page/ConfigThreshold",
  "cloudera/cmf/page/ConfigInputList",
  "cloudera/cmf/page/ConfigInputWithUnit",
  "cloudera/form/Form",
  "cloudera/form/ShiftClickSelector",
  "cloudera/Util",
  "cloudera/common/I18nDataTable"
], function(ConfigThreshold, ConfigInputList, ConfigInputWithUnit, Form, ShiftClickSelector, Util, I18nDataTable) {

return function(options){
  var form = new Form();
  var tableId = "configOverrideTable";

  var dataTableSettings = {
    "bPaginate": false,
    "bInfo": false,
    "bSortCellsTop": true,
    "sDom": "t",
    "bAutoWidth": false,
    "aaSorting": [[ 3, "asc" ]],
    "aoColumnDefs": [
      { "bSortable": false, "aTargets": [0,1] }
    ]
  };
  I18nDataTable.initialize(dataTableSettings);

  /**
   * Attaches DataTable to the main table.
   */
  var attachDataTable = function() {
    $("#" + tableId).dataTable(dataTableSettings);
    $("#" + tableId).ShiftClickSelector();

    //Handles the logic for row filtering.  Returns
    //true if a row passes all the filters and
    //should be displayed.
    $.fn.dataTableExt.afnFiltering.push(
      function( oSettings, aData, iDataIndex ) {
        if ( $(oSettings.nTable).attr("id") !== tableId ) {
          return true;
        }
        var filterValue = $(aData[2]).html().indexOf($("#filterValue").val()) !== -1;
        var filterHost = aData[3].indexOf($("#filterHost").val()) !== -1;
        var filterRack = aData[4].indexOf($("#filterRack").val()) !== -1;

        return filterValue && filterHost && filterRack;
      }
    );
  };

  var renderDataTable = function(vars) {
    $("#" + tableId).dataTable().fnDraw();
  };

  var attachEventHandlersToFilters = function() {
    //Bit of a hack.  This is needed
    //to trigger a change event properly
    //in Chrome.
    $(".filter").click(function(e) {
      $(e.target).trigger("change");
    });

    $(".filter").keyup(function(e) {
      $(e.target).trigger("change");
    });

    $(".filter").change(function(e) {
      $("#" + tableId).dataTable().fnDraw();
    });
  };

  var attachEventHandlersToClickAll = function() {
    //check all/none handler
    $("#checkAll").click(function(e) {
      form.setCheckedStateForTableColumn(e.target, 0, $(e.target).prop("checked"));
    });
  };

  /**
   * Before form submission, need to disable all the input fields in the
   * value column.
   */
  var disableAllValueFieldsInsideTable = function() {
    $("#" + tableId).find("tbody .value").find("input,textarea").prop("disabled", true);
  };

  var makeVisibleTextAreaResizable = function($textarea) {
    if ($textarea.is(":visible")) {
      $textarea.resizable({
        minHeight: 100,
        minWidth: 600
      });
    }
  };

  var makeHiddenTextAreaResizable = function($textarea) {
    setTimeout(function() {
      makeVisibleTextAreaResizable($textarea);
    }, 50);
  };

  var makeOtherTextAreaResizable = function() {
    var $textarea = $("#other").find("textarea");
    makeVisibleTextAreaResizable($textarea);
  };

  var showOrHideOther = function($overrideSelect) {
    var $other = $("#other");
    if ($(".booleanContainer", $other).length > 0) {
      if ( $("option:selected", $($overrideSelect) ).val() === "_other") {
        var defaultValue = $("input[type=hidden].defaultValue", $other).val();
        $("input[type=hidden].submittedValue", $other).val(defaultValue);
        $other.find("input[type=checkbox]").removeClass("hidden");
      } else {
        $other.find("input[type=checkbox]").addClass("hidden");
      }
    } else {
      if ( $("option:selected", $($overrideSelect) ).val() === "_other") {
        $other.find(".defaultGroup").find("input, textarea, select").attr("disable", "disable");
        $other.find(".overrideGroup").removeClass("hidden").find("input, textarea, select").removeAttr("disable");
        var $textarea = $other.find("textarea");
        makeHiddenTextAreaResizable($textarea);
      } else {
        $other.find(".defaultGroup").find("input, textarea, select").removeAttr("disable");
        $other.find(".overrideGroup").addClass("hidden").find("input, textarea, select").attr("disable", "disable");
      }
    }
  };

  var applyOverrideDropdown = function(vars) {
    var $overrideSelect = $("#override");
    showOrHideOther($overrideSelect);
  };

  /**
   * When user changes the override dropdown, show/hide the
   * other element.
   */
  var attachEventHandlersToOverrideDropdown = function() {
    var $overrideSelect = $("#override");
    $overrideSelect.change(function(evt) {
      showOrHideOther($overrideSelect);
      evt.preventDefault();
    });
  };

  /**
   * Change handler when user changes the threshold widget.
   */
  var onThresholdSelectionChanged = function(evt) {
    var $select = $(evt.target);
    ConfigThreshold.onThresholdSelectionChanged($select);
  };

  /**
   * When handling thresholds, this needs extra handling.
   */
  var attachEventHandlersToOtherThreshold = function() {
    $("#other .warningThreshold select").change(onThresholdSelectionChanged);
    $("#other .criticalThreshold select").change(onThresholdSelectionChanged);
  };

  /**
   * Before form submission, need to reconstruct the threshold JSON.
   */
  var onThresholdBeforeSubmit = function(index, container) {
    var $container = $(container);
    var defaultValueString = $container
      .siblings(".defaultGroup").find("input[type=hidden]").val();
    if (defaultValueString) {
      ConfigThreshold.onThresholdBeforeSubmit($container, defaultValueString);
    }
  };

  /**
   * Need to reconstruct the threshold JSON.
   */
  var processOtherThresholdBeforeSubmit = function() {
    $("#other .overrideGroup").each(onThresholdBeforeSubmit);
  };

  /**
   * Before form submission, need to reconstruct the comma separated list.
   */
  var onInputListBeforeSubmit = function(index, container) {
    ConfigInputList.onInputListBeforeSubmit($(container));
  };

  var processOtherInputListBeforeSubmit = function() {
    $("#other .overrideGroup").each(onInputListBeforeSubmit);
  };

  var onInputWithUnitBeforeSubmit = function(index, container) {
    ConfigInputWithUnit.onInputWithUnitBeforeSubmit($(container));
  };

  var processOtherInputWithUnitBeforeSubmit = function() {
    $("#other .overrideGroup").each(onInputWithUnitBeforeSubmit);
  };

  var onCheckboxBeforeSubmit = function(index, container) {
    // toggle the hidden input field in the override section between 'true'|'false'.
    // So the value is in sync with the state of the contextElement, which is a checkbox.
    var $checkbox = $(container).find("input[type=checkbox]");
    if ($checkbox.length > 0) {
      var value = $checkbox.attr('checked') === "checked" ? "true" : "false";
      $(container).find("input[type=hidden]").val(value);
    }
  };

  /**
   * Need to reconstruct the checkbox.
   */
  var processOtherCheckboxBeforeSubmit = function () {
    $("#other .booleanContainer").each(onCheckboxBeforeSubmit);
  };

  var getCheckedRowCount = function() {
    var result = $("input[name=id]:checked").length;
    return result;
  };

  /**
   * Before form submission, validate the form, need to disable
   * any hidden fields in the value column.
   */
  var onFormSubmit = function(event) {
    var valid = $(this).valid();
    if (!valid) {
      return false;
    }
    if (getCheckedRowCount() === 0) {
      $("#formError").html("Select at least one row, then click Apply.").show();
      return false;
    } else {
      $("#formError").hide();
    }
    disableAllValueFieldsInsideTable();
    processOtherThresholdBeforeSubmit();
    processOtherInputListBeforeSubmit();
    processOtherCheckboxBeforeSubmit();
    processOtherInputWithUnitBeforeSubmit();
  };

  attachDataTable();
  attachEventHandlersToFilters();
  attachEventHandlersToClickAll();
  attachEventHandlersToOverrideDropdown();
  attachEventHandlersToOtherThreshold();

  $("#mainForm").submit(onFormSubmit);

  var href = window.location.href;
  var params = Util.unparam(href.slice(href.indexOf('?') + 1));
  applyOverrideDropdown(params);
  makeOtherTextAreaResizable();
  renderDataTable(params);
};

});
