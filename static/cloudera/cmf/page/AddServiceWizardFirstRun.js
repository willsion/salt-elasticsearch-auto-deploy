// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/Util",
  "cloudera/cmf/include/ProgressBar",
  "cloudera/common/I18n"
], function(Util, ProgressBar, I18n) {

return function(options) {
    var scheduleNextUpdate;
    var showUnloadWarning = true;

    function fetchData() {
      $.get(
        options.firstRunURL + "?id=" + options.id + "&r=" + Math.random(),
        function(response) {
          var $container = $("#addServiceWizardFirstRunContainer");
          Util.html($container, response);
          if ($(".FAILED").length > 0) {
            $(".errorSummary").removeClass("hidden");
          } else if ($(".FirstRunProgressRow").length === $(".SUCCEEDED").length) {
            $("#overallProgress").parent().ProgressBar('success');
            $("#continueButton").removeAttr("disabled");
            showUnloadWarning = false;
          } else {
            scheduleNextUpdate();
          }
        }
      );
    }

    scheduleNextUpdate = function() {
      setTimeout(fetchData, 1000);
    };

    scheduleNextUpdate();

    var submitted = false;
    $('#buttons').submit(function(event) {
      // prevent double form submission
      if (submitted) {
        event.preventDefault();
        return false;
      }
      submitted = true;
    });

    $("#configButton, #retryButton").click(function() {
      showUnloadWarning = false;
    });

    $(window).bind('beforeunload', function() {
      if (showUnloadWarning) {
        return I18n.t("ui.noServiceStart");
      }
    });
};

});
