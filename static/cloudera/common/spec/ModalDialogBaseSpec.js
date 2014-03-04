// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/ModalDialogBase'
], function(ModalDialogBase) {
  describe("ModalDialogBase tests", function() {
    var module, id = "myModalDialog", baseOptions = {};
    var $modal, $header, $footer;

    beforeEach(function() {
      spyOn($.fn, "modal");
      $modal = $("<div>").attr("id", id).appendTo(document.body);
      $header = $("<div>").addClass("modal-header").appendTo($modal);
      $footer = $("<div>").addClass("modal-footer").appendTo($modal);
      var $closeButton = $("<button>").addClass("close").appendTo($header);
      var $dismissButton = $("<button>").addClass("btn dismissButton").appendTo($footer);
    });

    afterEach(function() {
      $modal.remove();
    });

    it("should display a modal dialog with default options", function() {
      $modal.ModalDialogBase(baseOptions);
      expect($.fn.modal).wasCalled();
    });

    it("should display a hidden modal dialog", function() {
      var options = $.extend({}, baseOptions, {
        defaultVisible: false
      });
      $modal.ModalDialogBase(options);
      expect($.fn.modal).wasCalledWith("hide");
    });

    it("should make sure the modal dialog is not destroyed on clicking dismiss", function() {
      var options = $.extend({}, baseOptions, {
        destroyOnClose: false
      });
      $modal.ModalDialogBase(options);
      $(".dismissButton").trigger("click");
      expect($.fn.modal).wasCalledWith("hide");
    });

    it("should make sure the modal dialog is not destroyed on clicking close", function() {
      var options = $.extend({}, baseOptions, {
        destroyOnClose: false
      });
      $modal.ModalDialogBase(options);
      $(".close").trigger("click");
      expect($.fn.modal).wasCalledWith("hide");
    });

    it("should make sure the modal dialog's important button are focused", function() {
      var options = $.extend({}, baseOptions, {
        focusFooterButton: true
      });
      spyOn($.fn, "focus");
      $modal.ModalDialogBase(options).trigger("shown");
      expect($.fn.focus).wasCalled();
    });

    function triggerKeyEvent($input, event, keyCode) {
      var evt = jQuery.Event(event);
      evt.keyCode = keyCode;
      $input.trigger(evt);
    }

    it("should trigger the primary button clicking when user presses the Enter key", function() {
      var $okButton = $("<button>").addClass("btn btn-primary").appendTo($footer);
      spyOn($.fn, "trigger").andCallThrough();

      var options = $.extend({}, baseOptions, {
        destroyOnClose: false
      });
      $modal.ModalDialogBase(options);

      triggerKeyEvent($modal, "keypress", $.ui.keyCode.ENTER);
      expect($okButton.trigger).wasCalled();
    });

    it("should close the dialog when user presses the Enter key", function() {
      var options = $.extend({}, baseOptions, {
        destroyOnClose: false
      });
      $modal.ModalDialogBase(options);

      triggerKeyEvent($modal, "keypress", $.ui.keyCode.ENTER);
      expect($.fn.modal).wasCalledWith("hide");
    });
  });
});
