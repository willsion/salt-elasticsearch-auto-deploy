// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([ "cloudera/common/AutoUpdatedContent" ], function(AutoUpdatedContent) {

  describe("AutoUpdatedContent Tests", function() {
    var id = "autoUpdatedContentSpec";
    var options = {
      containerSelector: "#" + id,
      updateIntervalInMS: 1000,
      url: "dontcare",
      urlParams: {}
    };

    var fakeData = "Content for AutoUpdatedContent";

    beforeEach(function () {
      jasmine.Ajax.useMock();

      var $div = $("<div></div>").attr("id", id);
      $("body").append($div);
      $div.show();
    });

    afterEach(function () {
      $("#" + id).remove();
    });

    it("should automatically update the content.", function() {
      var module = new AutoUpdatedContent(options);
      spyOn($, 'post').andCallThrough();
      module.start();
      expect($.post).wasCalled();
    });

    it("should not automatically update the content when the container is hidden.", function() {
      $("#" + id).hide().text("");
      var module = new AutoUpdatedContent(options);
      spyOn(module, "updateContainer").andCallThrough();
      spyOn(module, "scheduleNextUpdate").andCallThrough();

      module.start();
      expect(module.updateContainer).wasNotCalled();
      expect(module.scheduleNextUpdate).wasCalled();
    });

    it("should not automatically update the content when the container is removed.", function() {
      $("#" + id).remove();
      var module = new AutoUpdatedContent(options);
      spyOn(module, "partialUpdate").andCallThrough();
      spyOn(module, "scheduleNextUpdate").andCallThrough();

      module.start();
      expect(module.partialUpdate).wasNotCalled();
      expect(module.scheduleNextUpdate).wasNotCalled();
    });
  });
});
