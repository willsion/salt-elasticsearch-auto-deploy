// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/AjaxHtmlStep'
], function(AjaxHtmlStep) {
  describe("AjaxHtmlStep Tests", function() {
    var step, id = "ajaxHtmlStep";

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();
      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id).append("<div class='content'>");

      step = new AjaxHtmlStep({
        id: id,
        getUrl: function() {
          return "dontcare";
        }
      });
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize an AjaxHtmlStep", function() {
      var called = false;
      step.beforeEnter(function(){
        called = true;
      });

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: 'text/html',
        responseText: '<div class="data"></div>'
      });

      expect($("#" + id).find(".data").length).toBeGreaterThan(0);
      expect(step.enableContinue()).toBeTruthy();
      expect(called).toBeTruthy();
    });
  });
});
