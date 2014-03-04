// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/DeleteRoleConfigGroupPopupViewModel'
], function(DeleteRoleConfigGroupPopupViewModel) {
  describe("DeleteRoleConfigGroupPopupViewModel Tests", function() {
    var viewModel, $deleteRCGTestContainer, $deleteButton, $message;

    var options = {
      deleteUrl : "/foo/bar",
      modalId : "deleteRCGTestContainer",
      okMessage : "OK"
    };

    beforeEach(function() {
      $deleteRCGTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));

      $deleteButton = $('<button>foo</button>')
        .attr("class", "deleteGroupButton")
        .attr("data-bind", "click: deleteButtonClick")
        .appendTo($deleteRCGTestContainer);

      $message = $('<div>')
        .attr("class", "message")
        .appendTo($deleteRCGTestContainer);

      viewModel = new DeleteRoleConfigGroupPopupViewModel(options);
    });

    afterEach(function() {
      $deleteRCGTestContainer.remove();
      viewModel = null;
    });

    it("should post an execute callback", function() {
      spyOn(jQuery, "post");
      viewModel.applyBindings();

      $deleteButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(3);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
    });

    it("should update error message", function() {
      spyOn(jQuery, "publish");

      var response = {
        message : "this is an error!"
      };

      viewModel.handleErrors(response);
      expect(jQuery.publish).not.toHaveBeenCalledWith("popupActionCompleted");
      expect($(".message").html()).toBe(response.message);
    });

    it("should publish popupActionCompleted", function() {
      spyOn(jQuery, "publish");

      var response = {
        message : options.okMessage
      };

      viewModel.handleErrors(response);
      expect(jQuery.publish).toHaveBeenCalledWith("popupActionCompleted");
    });
  });
});
