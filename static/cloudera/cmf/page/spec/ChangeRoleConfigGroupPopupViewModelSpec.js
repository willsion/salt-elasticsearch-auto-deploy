// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/ChangeRoleConfigGroupPopupViewModel',
  'knockout'
], function(ChangeRoleConfigGroupPopupViewModel, ko) {

  describe("ChangeRoleConfigGroupPopupViewModel Tests", function() {
    var viewModel, $changeRCGTestContainer, $changeMembershipButton, $message;

    var options = {
      changeUrl : "/foo/bar",
      modalId : "changeRCGTestContainer",
      roleType : "DATANODE",
      oldGroupName : "oldGroupName",
      okMessage : "OK"
    };

    beforeEach(function() {
      $changeRCGTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));
      $message = $('<div class="message"></div>').appendTo($changeRCGTestContainer);
      $changeMembershipButton = $('<button>foo</button>')
        .attr("class", "changeMembershipButton")
        .attr("data-bind", "click: changeMembershipButtonClick")
        .appendTo($changeRCGTestContainer);

      viewModel = new ChangeRoleConfigGroupPopupViewModel(options);
    });

    afterEach(function() {
      $changeRCGTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, 'post');
      viewModel.applyBindings();

      $changeMembershipButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
    });

    it("should publish popupActionCompleted", function() {
      spyOn(jQuery, "publish");

      var response = {
        message: options.okMessage
      };

      viewModel.handleErrors(response);

      expect(jQuery.publish).toHaveBeenCalledWith("popupActionCompleted");
    });

    it("should handle error", function() {
      var error = "this is an error!";

      var response = {
        message: error
      };

      viewModel.handleErrors(response);

      expect($message.hasClass("error")).toBe(true);
      expect($message.html()).toEqual(error);
    });
  });
});
