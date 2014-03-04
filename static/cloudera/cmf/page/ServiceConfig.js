// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/page/ConfigThreshold",
  "cloudera/cmf/page/ConfigInputList",
  "cloudera/cmf/page/ConfigInputWithUnit"
], function(ConfigThreshold, ConfigInputList, ConfigInputWithUnit) {
/**
 * Contains JavaScript that interacts with the Service/Role Config screen.
 */
return function(options){
  // Flag to prevent accidentally leaving this page.
  var isDirty = false;
  var PASSWORD_MASK = options.passwordMask;

  /**
   * Gets the container for the default section.
   * There may be multiple elements.
   */
  var getConfigDefaultElems = function($td){
    return $(".defaultGroup", $td);
  };

  /**
   * Gets the container for the override section.
   * There may be multiple elements.
   */
  var getConfigOverrideElems = function($td){
    return $(".overrideGroup", $td);
  };

  /**
   * Gets the container for a boolean config widget.
   * There will be only one element.
   */
  var getBooleanConfigElem = function($td){
    return $(".booleanContainer", $td);
  };

  /**
   * Edit click handler.
   *
   * This function finds the default section, override section
   * of this configuration parameter,
   * toggles the visibility of the sections,
   * and enabled/disabled state of form controls inside them.
   */
  var configParamEdit = function($td){
    getConfigDefaultElems($td).each(function(index, elem){
      $("input, textarea", elem).attr('disabled', true);
      $(elem).addClass("hidden");
    });

    getConfigOverrideElems($td).each(function(index, elem){
      $(elem).removeClass("hidden");
      // Enable input or textarea.
      $("input, textarea", elem).attr("disabled", false).focus();
      // Ensure the checked radio box is focused.
      $("input[type=radio]:checked", elem).focus();
    });
    // prevent the default anchor action.
    return false;
  };

  var configParamErase = function($td){
    getBooleanConfigElem($td).each(function(index, elem) {
      var defaultValue = $("input[type=hidden].defaultValue", elem).val();
      var $checkbox = $('input[type="checkbox"]', elem);

      $("input[type=hidden].submittedValue", elem).val(defaultValue);
      $(".inheritedMsg", elem).removeClass("hidden");
      if (defaultValue === "true") {
        $checkbox.attr("checked", "checked");
      } else {
        // this captures both the defaultValue === true and
        // the defaultValue === null cases.
        $checkbox.removeAttr("checked");
      }
    });

    getConfigOverrideElems($td).each(function(index, elem){
      $(elem).addClass("hidden");
      $("input, textarea", elem).attr("disabled", true);
    });

    getConfigDefaultElems($td).each(function(index, elem){
      $(elem).removeClass("hidden");
      $("input, textarea", elem).attr("disabled", false);
      // Special Case here:
      // checkbox is kept disabled because we cannot use the checkbox for 3 states.
      // (default, true, false)
      $("input[type=checkbox]", elem).attr("disabled", true);
    });
    // prevent the default anchor action.
    return false;
  };
  
  var onThresholdSelectionChanged = function(evt) {
    var $select = $(evt.target);
    ConfigThreshold.onThresholdSelectionChanged($select);
  };

  var onThresholdBeforeSubmit = function(index, container) {
    var $container = $(container);
    var defaultValueString = $container
      .siblings(".defaultGroup").find("input[type=hidden]").val();
    ConfigThreshold.onThresholdBeforeSubmit($container, defaultValueString);
  };

  var onInputListBeforeSubmit = function(index, container) {
    ConfigInputList.onInputListBeforeSubmit($(container));
  };

  var onInputWithUnitBeforeSubmit = function(index, container) {
    ConfigInputWithUnit.onInputWithUnitBeforeSubmit($(container));
  };

  var disableUnmodifiedPasswordFields = function($form) {
    // OPSAPS-4141. Whenever we have a password property,
    // The server must not send the password value
    // literally to the browser.
    //
    // View Source would reveal the password.
    //
    // Instead, the server sends down a fake password,
    // the PASSWORD_MASK.
    //
    // On form submission,
    // 1. Detect if any password fields have been modified by
    // comparing the values to the fake password.
    //
    // 2. Disable any password fields that have not been modified,
    // so the POST request would not send the fake password.
    // The server would think these values have not been modified.
    $("input[type=password]", $form).each(function(){
      var $tgt = $(this);
      var value = $.trim($tgt.val());
      var allStarsRegex = /^\*+$/;
      if (allStarsRegex.test(value)) {
        $tgt.prop("disabled", true);
      }
    });
  };

  /**
   * Mark all the rows with class notSection. This hides them.
   */
  var hideAllRows = function () {
    $("form.cmfConfig").find("tr.configRow").addClass("notSection");
  };

  /**
   * Show all those errors
   */
  var showAllRowsWithErrors = function () {
    $("form.cmfConfig").find(".error").each(function (i, elem) {
      var $elem = $(elem);
      $elem.closest("tr.configRow")
        .removeClass("notSection").removeClass("notKeyword");
    });
  };

  var prepareInputsForSubmit = function() {
    var $form = $("form.cmfConfig");
    $form.find(".dualThreshold").parents(".overrideGroup").each(onThresholdBeforeSubmit);
    $form.find(".hiddenInputList").parents(".overrideGroup").each(onInputListBeforeSubmit);
    $form.find(".inputWithUnit").parents(".overrideGroup").each(onInputWithUnitBeforeSubmit);
    disableUnmodifiedPasswordFields($form);
    $form = null;
  };

  $(function(){
    $("form.cmfConfig").validate();

    /**
     * Before submitting the form,
     * we need to find all dualThreshold cells,
     * the corresponding warning and critical values,
     * and replace the hidden dualThreshold value with the JSON
     * representation.
     */
    $("form.cmfConfig").submit(function(event) {
      var valid = $("form.cmfConfig").valid();
      if (!options.disableJSValidation && !valid) {
        hideAllRows();
        showAllRowsWithErrors();
        return false;
      }
      prepareInputsForSubmit();
    });

    $(".cmfConfig .DataTable .warningThreshold select").change(onThresholdSelectionChanged);
    $(".cmfConfig .DataTable .criticalThreshold select").change(onThresholdSelectionChanged);

    $(".cmfConfig .DataTable > tbody").click(function(evt){
      var $tgt = $(evt.target);
      var $td = $tgt.parents("td.editable");
      if ($tgt.is("td.editable")) {
        $td = $tgt;
      }

      // There are 5 cases that we want to handle:
      // Edit/Erase, Expand/Collapse, and clicking on the checkbox or its container.
      // For now, assume we don't have any other elements
      // that share the same class name.
      if ($td && $td.length === 1) {

        if ($tgt.hasClass("defaultGroup") || $tgt.parents(".defaultGroup").length > 0) {
          isDirty = true;
          return configParamEdit($td);
        } else if ($tgt.hasClass("erase")) {
          // clicked on the erase icon.
          isDirty = true;
          return configParamErase($td);
        } else if ($tgt.hasClass("booleanContainer") || $tgt.parents(".booleanContainer").length > 0) {
          // toggle the hidden input field in the override section between 'true'|'false'.
          // So the value is in sync with the state of the contextElement, which is a checkbox.
          //
          // also, treat click on container div as a click on the checkbox.
          isDirty = true;
          var $booleanContainer = getBooleanConfigElem($td);
          var $checkbox;

          if ($tgt.is("input[type=checkbox]")) {
            $checkbox = $tgt;
          } else {
            $checkbox = $("input[type=checkbox]", $booleanContainer);
            $checkbox.attr("checked", !$checkbox.attr("checked"));
          }

          var value = $checkbox.attr('checked') === "checked" ? "true" : "false";
          $("input[type=hidden].submittedValue", $booleanContainer).attr('value', value);
          $(".overrideGroup", $booleanContainer).removeClass("hidden");
          $(".inheritedMsg", $booleanContainer).addClass("hidden");

        } else if ($tgt.is("td.editable")) {
          // simulate editing.
          isDirty = true;
          return configParamEdit($td);
        }
      }
    });

    var $table = $("#configTableBase");

    // I don't think change function bubbles, so we need to
    // listen to each element.
    $table.find("input,textarea,select").change(function(){
      isDirty = true;
    });

    $(".saveConfigurationButton").click(function(){
      isDirty = false;
    });

    var toggleHoverClass = function(evt, isAdd) {
      var $target = $(evt.target);
      if (!$target.is("td.editable")) {
        $target = $target.closest("td");
      }
      if (isAdd) {
        $target.addClass("hover");
      } else {
        $target.removeClass("hover");
      }
    };

    $(".cmfConfig td.editable")
      .mouseover(function(evt) {
        toggleHoverClass(evt, true);
      })
      .mouseout(function(evt) {
        toggleHoverClass(evt, false);
      });

    var makeVisibleTextAreaResizable = function($textarea) {
      if ($textarea.is(":visible")) {
        $textarea.resizable({
          minHeight: 100
        });
      }
    };

    $(".overrideGroup textarea").each(function(i, textarea) {
      var $textarea = $(textarea);
      makeVisibleTextAreaResizable($textarea);
      $textarea.closest(".configRow").find(".edit").click(function(evt) {
        // we need to wait for a short duration first because
        // the textarea may not be visible yet.
        // This doesn't guarantee visibility either, but
        // setInterval is a bit more complicated.
        setTimeout(function() {
          makeVisibleTextAreaResizable($textarea);
        }, 50);
      });
    });
  });

  if(!options.disableBeforeUnloadTip) {
    jQuery(window).bind('beforeunload', function(){
      if (isDirty) {
        return options.saveConfigTip;
      }
    });
  }

  var handle = $.subscribe("prepareInputsForSubmit", prepareInputsForSubmit);

  return {
    subscriptionHandles : [handle]
  };
};

});
