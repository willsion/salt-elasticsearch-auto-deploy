// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([], function() {
  /**
   * Provides additional functionality for the LicenseAgreement.
   *
   * options:
   *  form - The form that will be submitted for instance selection.
   *  dialog - The dialog that will be presented with the license information.
   *  radioName - The name of the radio buttons for which the license warning should be shown.
   */
  var LicenseAgreement = function(options) {
    var self = this;
    self.$radioButtons = $('[name=' + options.radioName + ']');
    self.licenseAccepted = false;
    self.$instForm = $(options.form);
    self.$dialog = $(options.dialog);

    if (self.$radioButtons.length > 0) {
      var $accept = self.$dialog.find(".accept-agreement");

      self.$instForm.submit(self.submitHandler.bind(self));

      $accept.click(self.acceptHandler.bind(self));

      self.$dialog.on('hide', self.hideDialogHandler.bind(self));
    }
  };
  /*
   * Exposed for testing.
   */
  LicenseAgreement.prototype.hideDialogHandler = function() {
    if (!this.licenseAccepted) {
      this.$radioButtons.attr('checked', false);
      this.$instForm.find('[data-disable-after-click-once=true]').removeClass('disabled');
    }
  };

  LicenseAgreement.prototype.acceptHandler = function() {
    this.licenseAccepted = true;
    this.$instForm.find('[name=submit]').removeClass('disabled').click();
  };

  LicenseAgreement.prototype.submitHandler = function() {
    var selected = this.$radioButtons.filter(':checked').length > 0;

    if (selected && !this.licenseAccepted) {
      this.$dialog.modal('show');
    }

    return !selected || this.licenseAccepted;
  };

  return LicenseAgreement;
});