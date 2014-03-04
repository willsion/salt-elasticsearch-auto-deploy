// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
/**
 * This creates an element into a closeable alert. In addition to looking like
 * a bootstrap alert, this will add a dismiss(close) button and when clicked
 * we write to the user settings so that the alert is no longer shown.
 *
 * Example HTML:
 *   <div class="CloseableAlert" closeable-alert-id="myId">myMessage</div>
 */
define([
  "cloudera/common/UserSettings",
  "underscore"
], function(UserSettings, _) {

  /**
   * options = {
   *   element: "The selector for the alert element."
   *   alertId: "A global id for the alert. Used to identify the alert in user settings"
   *   keyPrefix: "The prefix added to alertId to scope it for User Settings."
   * }
   */
  function CloseableAlert(options) {
    var self, $alert;
    self = this;
    $alert = $(options.element);
    self.toggleKey = options.keyPrefix + "." + options.alertId + ".hidden";

    /**
     * For the provided element, it will be converted into a
     * bootstrap alert. It will also check to see if this alert
     * should be visible.
     */
    self.onLoad = function() {
      // Add alert class
      $alert.addClass('alert');
      // Add the close button
      $alert.prepend('<a href="#" class="close">&times;</a>');

      // Make alert into an alert.
      $alert.alert();

      // Register the close event.
      $alert.find(".close").click(self.close);

      // Check to see if we initially should show this alert
      self.checkVisibility();
    };

    /**
     * Triggered when a user clicks the close button.
     */
    self.close = function(evt) {
      UserSettings.update(self.toggleKey, true, function(response) {
        $alert.alert('close');
      });
    };

    /**
     * @return if the alert should be visible.
     */
    self.checkVisibility = function() {
      // Check if the alert should be visible.
      UserSettings.get(self.toggleKey, function(hidden) {
        $alert.toggle(!hidden);
      });
    };
  }

  /**
   * Creates the jquery plugin.
   */
  $.fn.CloseableAlert = function (option) {
    return this.each(function () {
      var $this, alertId, data;
      $this = $(this);
      alertId = $this.data('closeable-alert-id');
      if (_.isUndefined(alertId)) {
        throw new Error("A closeable-alert-id is missing.");
      }

      data = $this.data('CloseableAlert');
      if (!data) {
        data = new CloseableAlert({
          element : $this,
          alertId : alertId,
          keyPrefix : 'com.cloudera.cmf.closeableAlertDismiss'
        });
        $this.data('CloseableAlert', data);
      }
      data.onLoad();
    });
  };

  return $.fn.CloseableAlert;
});
