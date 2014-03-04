// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/I18n",
  "cloudera/Util"
], function(I18n, Util) {
  "use strict";
  /**
   * options = {
   *   resetUrl: (required) the URL to reset the view
   *   resetButtonSelector: (required) the selector of the reset button.
   * }
   */
  return function ServiceChartsV2(options) {
    $(options.resetButtonSelector).click(function(evt) {
      var message = I18n.t("ui.resetConfirmation");
      $.publish("showConfirmation", [message, function() {
        $.post(options.resetUrl, function(response) {
          if (response.message === "OK") {
            Util.reloadPage();
          } else {
            $.publish("showError", [response.message]);
          }
        }, "json");
      }]);
      return false;
    });
  };
});
