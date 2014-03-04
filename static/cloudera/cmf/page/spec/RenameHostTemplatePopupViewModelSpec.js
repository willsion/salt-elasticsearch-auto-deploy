// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/RenameHostTemplatePopupViewModel',
  'knockout'
], function(RenameHostTemplatePopupViewModel, ko) {
  describe("RenameHostTemplatePopupViewModel Tests", function() {
    var viewModel, $renameHTTestContainer, $renameTemplateButton, $newTemplateInput;

    var options = {
      renameUrl : "/foo/bar",
      modalId : "renameHTTestContainer",
      okMessage : "OK",
      oldTemplateName : "old-template"
    };

    beforeEach(function() {
      $renameHTTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));

      $renameTemplateButton = $('<button>foo</button>')
        .attr("class", "renameTemplateButton")
        .attr("data-bind", "click: renameButtonClick")
        .appendTo($renameHTTestContainer);

      viewModel = new RenameHostTemplatePopupViewModel(options);
    });

    afterEach(function() {
      $renameHTTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, "post");
      viewModel.applyBindings();

      viewModel.newTemplateName("new-template");

      $renameTemplateButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
      expect(jQuery.post.mostRecentCall.args[1].oldTemplateName).toEqual("old-template");
      expect(jQuery.post.mostRecentCall.args[1].newTemplateName).toEqual("new-template");
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
      var error = "this is an error!";

      var response = {
        message : error
      };

      viewModel.handleErrors(response);

      expect(jQuery.publish).not.toHaveBeenCalledWith("popupActionCompleted");
      expect(viewModel.isSubmitted()).toBe(false);
    });
  });
});
