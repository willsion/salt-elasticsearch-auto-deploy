// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/CreateHostTemplatePopupViewModel'
], function(CreateHostTemplatePopupViewModel) {

  describe("CreateHostTemplatePopupViewModel Tests", function() {
    var viewModel, $createHTTestContainer, $select, $createTemplateButton;

    var options = {
      url : "/foo/bar",
      modalId : "createHTTestContainer",
      okMessage : "OK",
      clusterId : 1
    };

    beforeEach(function() {
      $createHTTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));
      $select = $('<select>')
        .attr("class", "groupName")
        .append('<option value="1">1</option>')
        .append('<option value="2">2</option>')
        .appendTo($createHTTestContainer);

      $createTemplateButton = $('<button>foo</button>')
        .attr("class", "createTemplateButton")
        .attr("data-bind", "click: createButtonClick")
        .appendTo($createHTTestContainer);

      viewModel = new CreateHostTemplatePopupViewModel(options);
    });

    afterEach(function() {
      $createHTTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, 'post');
      viewModel.applyBindings();

      $createTemplateButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
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

    it("should update group names", function() {
      viewModel.applyBindings();
      $select.val("1");
      viewModel.updateGroupNames();
      expect(viewModel.groupNames()).toEqual(["1"]);

      $select.val("2");
      viewModel.updateGroupNames();
      expect(viewModel.groupNames()).toEqual(["2"]);
    });
  });
});
