// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  'cloudera/common/ErrorDialog'
], function(Util, ErrorDialog) {
  describe("ErrorDialog Tests", function() {
    var errorDialog;
    var id = "myErrorDialog";
    var selector = "#" + id;

    beforeEach(function () {
      $('<div id="' + id + '">' +
        '<div class="modal-header"><h3 class="title"></h3></div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"><a class="closeButton"></a></div>' +
        '</div>').appendTo("body");
      errorDialog = new ErrorDialog({
        dialog: selector
      });
    });

    afterEach(function () {
      Util.unsubscribe(errorDialog);
      $(selector).remove();
    });

    it("should update the dialog's content.", function() {
      var message = "My Fancy Error Message";

      spyOn(errorDialog, 'show');
      $.publish("showError", [message]);

      expect($(selector).find(".modal-body").html()).toEqual(message);
      expect(errorDialog.show).wasCalled();
    });

    it("should update the dialog's title and content.", function() {
      var message = "My Fancy Alert Message";
      var title = "Fancy Title";

      spyOn(errorDialog, 'show');
      $.publish("showAlert", [message, title]);

      expect($(selector).find(".modal-body").html()).toEqual(message);
      expect($(selector).find(".title").html()).toEqual(title);
      expect(errorDialog.show).wasCalled();
    });

    it("should close the dialog", function() {
      spyOn(errorDialog, 'hide');

      $(selector).find(".closeButton").trigger("click");
      expect(errorDialog.hide).wasCalled();
    });
  });
});
