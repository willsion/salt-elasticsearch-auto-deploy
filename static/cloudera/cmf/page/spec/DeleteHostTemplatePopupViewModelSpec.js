// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/DeleteHostTemplatePopupViewModel'
], function(DeleteHostTemplatePopupViewModel) {

  describe("DeleteHostTemplatePopupViewModel Tests", function() {
    var viewModel, $deleteHTTestContainer, $deleteTemplateButton;

    var options = {
      deleteUrl : "/foo/bar",
      modalId : "deleteHTTestContainer",
      okMessage : "OK",
      templateName : "foo-template"
    };

    beforeEach(function() {
      $deleteHTTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));

      $deleteTemplateButton = $('<button>foo</button>')
        .attr("class", "deleteTemplateButton")
        .attr("data-bind", "click: deleteButtonClick")
        .appendTo($deleteHTTestContainer);

      viewModel = new DeleteHostTemplatePopupViewModel(options);
    });

    afterEach(function() {
      $deleteHTTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, "post");
      viewModel.applyBindings();

      $deleteTemplateButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
    });

    it("should publish popupActionCompleted", function() {
      spyOn(jQuery, "publish");

      var response = {
        message : options.okMessage
      };

      viewModel.handleResponse(response);

      expect(jQuery.publish).toHaveBeenCalledWith("popupActionCompleted");
    });
  });
});
