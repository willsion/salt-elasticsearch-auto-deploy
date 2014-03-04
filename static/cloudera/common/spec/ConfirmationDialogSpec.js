// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  'cloudera/common/ConfirmationDialog'
], function(Util, ConfirmationDialog) {
  describe("ConfirmationDialog Tests", function() {
    var confirmationDialog;
    var id = "myConfirmationDialog";
    var selector = "#" + id;

    beforeEach(function () {
      $('<div id="' + id + '">' +
        '<div class="modal-header"><h3 class="title"></h3></div>' +
        '<div class="modal-body"><p class="confirmation-message"></p></div>' +
        '<div class="modal-footer"><a class="confirmation-button"></a><a class="closeButton"></a></div>' +
        '</div>').appendTo("body");

      spyOn($.fn, "DisableAfterClickOnce");

      confirmationDialog = new ConfirmationDialog({
        dialog: selector
      });

      expect($.fn.DisableAfterClickOnce).wasCalled();
    });

    afterEach(function () {
      Util.unsubscribe(confirmationDialog);
      $(selector).remove();
    });

    it("should update the dialog's content.", function() {
      var callback = jasmine.createSpy();
      var message = "My Fancy Confirmation Message";

      spyOn(confirmationDialog, 'show');
      spyOn(confirmationDialog, 'hide');
      $.publish("showConfirmation", [message, callback]);
      expect(confirmationDialog.show).wasCalled();
      expect($(selector).find(".modal-body .confirmation-message").html()).toEqual(message);

      $(selector).find(".confirmation-button").trigger("click");
      expect(callback).wasCalled();
      expect(confirmationDialog.hide).wasCalled();
    });

    it("should close the dialog", function() {
      spyOn(confirmationDialog, 'hide');

      $(selector).find(".closeButton").trigger("click");
      expect(confirmationDialog.hide).wasCalled();
    });
  });
});
