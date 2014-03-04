// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/SelectAll"
], function(SelectAll) {
  return function() {
    $("#hostsInMM").SelectAll();
    $("#subordinatesInMM").SelectAll();
    var refresh = function() {
      var $form = $("#changeMaintenanceModeForm");
      if ($form.length > 0) {
        var $checkedBoxes = $form.find("tbody input[type=checkbox]:checked");
        if ($checkedBoxes.length > 0) {
          $("#exitForSelection").show();
        } else {
          $("#exitForSelection").hide();
        }
        setTimeout(refresh, 500);
      }
    };
    refresh();
  };
});
