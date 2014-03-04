// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/wizard/CommandDetailsStep'
], function(CommandDetailsStep) {
  describe("CommandDetailsStep Tests", function() {
    var step, id = "commandDetailsStep";

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $("<div>").attr("id", id).appendTo(document.body);
      $("#" + id).append("<div class='commandDetailsUrl' data-url='/cmf/someUrl/{commandId}'>");
      $("#" + id).append("<div class='content'>");

      step = new CommandDetailsStep({
        id: id,
        getCommandId: function() {
          return "123";
        }
      });
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should ajax call a CommandDetailsStep and the response says it is not complete", function() {
      spyOn($, 'post').andCallThrough();

      var called = false;
      step.beforeEnter(function(){
        called = true;
      });
      expect(called).toBeTruthy();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: 'text/html',
        responseText: '<div>Not Completed</div>'
      });
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/cmf/someUrl/123");
      expect(step.enableContinue()).toBeFalsy();
    });

    it("should ajax call a CommandDetailsStep and the command is completed", function() {
      spyOn($, 'post').andCallThrough();

      var called = false;
      step.beforeEnter(function(){
        called = true;
      });

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        contentType: 'text/html',
        responseText: '<div class="commandCompleted"></div>'
      });
      expect(jQuery.post.mostRecentCall.args[0]).toEqual("/cmf/someUrl/123");
      expect(step.enableContinue()).toBeTruthy();
    });
  });
});
