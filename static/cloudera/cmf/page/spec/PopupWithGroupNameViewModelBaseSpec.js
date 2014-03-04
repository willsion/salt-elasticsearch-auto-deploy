// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/PopupWithGroupNameViewModelBase',
  'knockout'
], function(PopupWithGroupNameViewModelBase, ko) {

  describe("PopupWithGroupNameViewModelBase Tests", function() {
    var viewModel, $testContainer;

    var options = {
      modalId : "testContainer",
      okMessage : "OK"
    };

    beforeEach(function() {
      $testContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));

      viewModel = new PopupWithGroupNameViewModelBase(options);
    });

    afterEach(function() {
      $testContainer.remove();
      viewModel = null;
    });

    it("should publish popupActionCompleted", function() {
      spyOn(jQuery, "publish");

      var response = {
        message : options.okMessage
      };

      viewModel.handleErrors(response);

      expect(jQuery.publish).toHaveBeenCalledWith("popupActionCompleted");
    });

    it("should handle error", function() {
      spyOn(jQuery, "publish");
      
      var response = {
        message : "this is an error!"
      };

      viewModel.handleErrors(response);

      expect(jQuery.publish).not.toHaveBeenCalledWith("popupActionCompleted");
      expect(viewModel.isSubmitted()).toBe(false);
    });
  });
});
