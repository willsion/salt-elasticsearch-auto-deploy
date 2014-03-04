// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore"
], function(Util, _) {

  return Class.extend({
    /**
     * options = {
     *   container: "the DOM selector of the container form",
     *   iframeElement: "the DOM selector of the output IFrame that we should check the result from"
     * }
     */
    init: function(options) {
      var self = this;
      self.options = $.extend({}, {
        container: ".upload-form",
        iframeElement: "#hiddenIframeForUpload"
      }, options);
      self.$container = $(self.options.container);

      self.getFileInput().change(function(e) {
        // Make the display input element in sync.
        // fakepath is something browsers add to hide the real path
        // of the selected file.
        var filename = self.getFileInput().val().replace("C:\\fakepath\\", "");
        // Display the filename only.
        self.getFileNameInput().val(filename);
        self.enableDisableUploadButton();
      });

      self.getFileNameIcon().click(function(evt) {
        self.showFileSelection();
      });

      self.getFileNameInput().click(function(evt) {
        self.showFileSelection();
      });

      self.getUploadButton().click(function(evt) {
        self.upload();
      });

      self.enableDisableUploadButton();
    },

    /**
     * Simulates the clicking on the file input.
     */
    showFileSelection: function() {
      this.getFileInput().trigger("click");
    },

    /**
     * the real file input element, which is hidden.
     */
    getFileInput: function() {
      return this.$container.find("input[type=file]");
    },

    /**
     * the file icon next to the file input.
     */
    getFileNameIcon: function() {
      return this.$container.find(".icon-file");
    },

    /**
     * the readonly displayed input that shows the filename.
     */
    getFileNameInput: function() {
      return this.$container.find("input[type=text]");
    },

    /**
     * The upload button next to the file input.
     */
    getUploadButton: function() {
      return this.$container.find("button.upload-btn");
    },

    /**
     * Sets the disable state for the upload button
     * based on whether the file input is populated or not.
     */
    enableDisableUploadButton: function() {
      var filename = this.getFileInput().val();
      if (filename === "") {
        this.getUploadButton().attr("disabled", "disabled");
      } else {
        this.getUploadButton().removeAttr("disabled");
      }
    },

    /**
     * Uploads the file.
     */
    upload: function() {
      this.$container.submit();
      this.clearPostOutput();
      this.checkPostOutput();
    },

    getSuccessContainer: function() {
      return this.$container.find(".success");
    },

    getErrorContainer: function() {
      return this.$container.find(".error");
    },

    getIFrameContent: function() {
      return $(this.options.iframeElement).contents();
    },

    clearPostOutput: function() {
      var $iframeContents = this.getIFrameContent();
      $.publish("fileUploaded", [false]);

      $iframeContents.find('input[name=error]').val("");
      $iframeContents.find('input[name=message]').val("");
    },

    checkPostOutput: function() {
      var self = this;
      var options = self.options;

      var $iframeContents = self.getIFrameContent();
      var $error = $iframeContents.find('input[name=error]');
      var $message = $iframeContents.find('input[name=message]');

      if ($error.length > 0 && $error.val()) {
        var error = $error.val();
        if (error === "false") {
          $.publish("fileUploaded", [true]);
          self.getSuccessContainer().show();
          self.getErrorContainer().hide();
        } else {
          self.getSuccessContainer().hide();
          self.getErrorContainer().html($message.val()).show();
        }
      } else if (!Util.getTestMode()) {
        _.delay(_.bind(self.checkPostOutput, self), 1000);
      }
    }
  });
});
