// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/layout/Toggler",
  "cloudera/common/I18n"
], function(Util, Toggler, I18n) {
  /**
   * options = {
   *   dialog = "selector or DOM of the dialog element."
   * }
   */
  function ErrorDialog(options) {
    var self = this;

    var $dialog = $(options.dialog);

    var showAlert = function(content, title) {
      $dialog.find(".modal-header .title").html(title);
      $dialog.find(".modal-body").html(content);
      self.show();
    };

    var showError = function(content) {
      var title = I18n.t("ui.error");
      showAlert(content, title);
    };

    var handle1 = $.subscribe("showError", showError);
    var handle2 = $.subscribe("showAlert", showAlert);

    self.subscriptionHandles = [handle1, handle2];

    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.show = function() {
      $dialog.modal("show");
    };

    self.hide = function() {
      $dialog.modal("hide");
    };

    $dialog.find(".modal-footer .closeButton").click(function() {
      self.hide();
    });
  }

  return ErrorDialog;
});
