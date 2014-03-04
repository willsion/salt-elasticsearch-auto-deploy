// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/CommandDetails'
], function(CommandDetails) {
  describe("CommandDetails Tests", function() {
    var id = "commandDetails", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id)
        .append('<input type="checkbox" name="showFailedOnly">')
        .append('<input type="checkbox" name="showActiveOnly">');
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize CommandDetails", function() {
      module = new CommandDetails({
        containerSelector: "#" + id,
        fetchUrl: "dontcare"
      });
      spyOn($, "publish");
      spyOn(module, "scheduleNextUpdate");

      module.fetchData();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: '<div class="overallProgress"/>',
        contentType: "text/html"
      });
      expect(module.scheduleNextUpdate).wasCalled();
      expect($.publish).wasNotCalled();
    });

    it("should initialize CommandDetails and find the command is complete", function() {
      module = new CommandDetails({
        containerSelector: "#" + id,
        fetchUrl: "dontcare"
      });

      spyOn($, "publish");
      spyOn(module, "scheduleNextUpdate");

      module.fetchData();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: '<div class="overallProgress"/>',
        contentType: "text/html"
      });

      expect(module.scheduleNextUpdate).wasCalled();
      expect($.publish).wasNotCalled();

      module.fetchData();
      request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: '<div class="overallProgress"/><div class="commandCompleted"/>',
        contentType: "text/html"
      });

      expect(module.scheduleNextUpdate.callCount).toEqual(1);
      expect($.publish).wasCalled();
    });
  });
});
