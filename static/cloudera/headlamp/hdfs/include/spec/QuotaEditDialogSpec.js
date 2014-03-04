// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/headlamp/hdfs/include/QuotaEditDialog'
], function(QuotaEditDialog) {
  describe("QuotaEditDialog Tests", function() {
    var id = "quotaEdit", module, options = {
      tableId: "aTable",
      setQuotaUrl: "dontcare"
    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      $("<div>").attr("id", id).appendTo(document.body);
      $("<form>").appendTo($("#" + id));
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should test saveQuota and succeed", function() {
      module = new QuotaEditDialog(options);
      spyOn(module, "updateTableRow");

      module.viewModel.saveQuota();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "OK"
      });
      expect(module.updateTableRow).wasCalled();
    });

    it("should test saveQuota and fail", function() {
      module = new QuotaEditDialog(options);
      spyOn(module, "updateTableRow");
      spyOn($, "publish");

      module.viewModel.saveQuota();
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: "text/html",
        responseText: "Error"
      });
      expect($.publish).wasCalledWith("showError", ["Error"]);
      expect(module.updateTableRow).wasNotCalled();
    });
  });
});
