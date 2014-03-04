// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/form/DisableAfterClickOnce"
], function(Util, I18n, DisableAfterClickOnce) {
  /**
   * options = {
   *   dialog = "selector or DOM of the dialog element."
   * }
   */
  function ConfirmationDialog(options) {
    var self = this;

    var $dialog = $(options.dialog);
    var $confirmationButton = $dialog.find(".modal-footer .confirmation-button");

    var showConfirmation = function(content, callback) {
      $dialog.find(".modal-body .confirmation-message").html(content);
      $dialog.find(".modal-footer .confirmation-button")
        .off("click")
        .on("click", function(evt) {
          if ($.isFunction(callback)) {
            callback();
          }
          self.hide();
        });
      self.show();
    };

    var handle1 = $.subscribe("showConfirmation", showConfirmation);

    self.subscriptionHandles = [handle1];

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

    $confirmationButton.DisableAfterClickOnce();

    $dialog.on('shown', function(){
      $confirmationButton.removeClass("disabled");
      $confirmationButton.focus();
    });
  }

  return ConfirmationDialog;
});
