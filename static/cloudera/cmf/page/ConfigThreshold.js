// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
/**
 * Contains JavaScript that interacts with the Threshold values.
 */
define([
  "cloudera/Util",
  "cloudera/cmf/page/ConfigInputWithUnit"
], function(Util, ConfigInputWithUnit) {

return {
onThresholdSelectionChanged: function($select) {
  var $tgt = $select;
  if ($tgt.val() !== "any" && $tgt.val() !== "never") {
    $tgt.parent().find(".inputWithUnitContainer")
      .removeClass("hidden")
      .find("input[type=text]:first").focus();
  } else {
    $tgt.parent().find(".inputWithUnitContainer")
      .addClass("hidden");
  }
},

onThresholdBeforeSubmit: function($container, defaultValueString) {
  var onInputWithUnitBeforeSubmit = function(index, container) {
    ConfigInputWithUnit.onInputWithUnitBeforeSubmit($(container));
  };

  var $warningContainer = $container.find(".warningThreshold");
  var $criticalContainer = $container.find(".criticalThreshold");

  // ensure the combined value of input * scale of unit is updated first.
  $warningContainer.each(onInputWithUnitBeforeSubmit);
  $criticalContainer.each(onInputWithUnitBeforeSubmit);

  // determine the warning/critical drop down selection
  // and the specific value (if there is one)
  var warningSelection = $warningContainer.find("select").val();
  // disable the specific warning value so it is not submitted to the server.
  var warningSpecific = $warningContainer.find(".inputWithUnit").prop("disabled", true).val();
  var warning = warningSpecific;
  var criticalSelection = $criticalContainer.find("select").val();
  // disable the specific critical value so it is not submitted to the server.
  var criticalSpecific = $criticalContainer.find(".inputWithUnit").prop("disabled", true).val();
  var critical = criticalSpecific;
  var defaultValueJSON, defaultCritical, defaultWarning;

  try {
    defaultValueJSON = JSON.parse(defaultValueString);
    defaultCritical = Util.convertIfNumber(defaultValueJSON.critical);
    defaultWarning = Util.convertIfNumber(defaultValueJSON.warning);
  } catch (ex) {
    console.log(ex);
  }

  var warningCheck = warningSelection;
  var criticalCheck = criticalSelection;

  if (warningSelection === "any") {
    warning = "-1.0";
  } else if (warningSelection === "never") {
    warning = "-2.0";
  } else {
    warningCheck = Number(warningSpecific);
  }

  if (criticalSelection === "any") {
    critical = "-1.0";
  } else if (criticalSelection === "never") {
    critical = "-2.0";
  } else {
    criticalCheck = Number(criticalSpecific);
  }
  
  // Check if the value we are submitting is equal to
  // the default value and submit the default value if
  // so. We need to do this to get around potential 
  // differences in how JSON is formatted by the client and server.
  if (warningCheck === defaultWarning &&
      criticalCheck === defaultCritical) {
    $container.find(".dualThreshold").val(defaultValueString);
    return;
  }

  if (warning && critical) {
    var dualThreshold = {
      warning: warning,
      critical: critical
    };

    var currentThreshold = JSON.parse($container.find(".dualThreshold").val());
    if (currentThreshold.warning !== dualThreshold.warning ||
        currentThreshold.critical !== dualThreshold.critical) {
      // This writes the value only when the fields individually are different.
      // This assumes Json2.js is included.
      $container.find(".dualThreshold").val(JSON.stringify(dualThreshold));
    }
  }
}
};
});
