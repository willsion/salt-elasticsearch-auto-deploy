// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/RenameRoleConfigGroupPopupViewModel'
], function(RenameRoleConfigGroupPopupViewModel) {

  describe("RenameRoleConfigGroupPopupViewModel Tests", function() {
    var viewModel, $renameRCGTestContainer, $renameGroupButton;

    var options = {
        renameUrl : "/foo/bar",
        modalId : "renameRCGTestContainer",
        okMessage : "OK"
    };

    beforeEach(function() {
      $renameRCGTestContainer = $('<div>').attr('id', options.modalId).appendTo($('body'));
      $renameGroupButton = $('<button>foo</button>')
        .attr("class", "renameGroupButton")
        .attr("data-bind", "click: renameButtonClick")
        .appendTo($renameRCGTestContainer);

      viewModel = new RenameRoleConfigGroupPopupViewModel(options);
    });

    afterEach(function() {
      $renameRCGTestContainer.remove();
      viewModel = null;
    });

    it("should post and execute callback", function() {
      spyOn(jQuery, 'post');
      viewModel.applyBindings();

      $renameGroupButton.click();

      expect(jQuery.post).wasCalled();
      expect(jQuery.post.mostRecentCall.args.length).toEqual(4);
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/foo/bar");
    });
  });
});
