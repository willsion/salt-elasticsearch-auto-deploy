// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/include/ProcessLogDisplay'
], function(ProcessLogDisplay) {
  describe("ProcessLogDisplay Tests", function() {
    var id = "processLogDisplay", module, $container;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
      $container = $("#" + id);
      $container
        .append('<a href="#" class="expandLogTails"/>')
        .append('<a href="#" class="collapseLogTails hidden"/>')
        .append('<div class="LogTails hidden"/>')
        .append('<a href="#" class="toggleLink"/>')
        .append('<div class="cmfRoleTab"/>')
        .append('<div class="cmfRoleTail"><pre/></div>');
      jasmine.Ajax.useMock();
      clearAjaxRequests();
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize ProcessLogDisplay", function() {
      module = new ProcessLogDisplay({
        container: "#" + id,
        id: "test1" + (new Date()),
        url: "dontcare"
      });
    });

    it("should test clicking the element with class=toggleLink", function() {
      module = new ProcessLogDisplay({
        container: "#" + id,
        id: "test2" + (new Date()),
        url: "dontcare"
      });

      $container.find(".toggleLink").trigger("click");
      expect($container.find(".expandLogTails").is(":visible")).toBeFalsy();
      expect($container.find(".LogTails").is(":visible")).toBeTruthy();
    });

    it("should test showing the role tab", function() {
      module = new ProcessLogDisplay({
        container: "#" + id,
        id: "test3" + (new Date()),
        url: "dontcare"
      });

      $container.find(".cmfRoleTab").trigger("shown");
      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: 'Hello World',
        contentType: "text"
      });

      expect($container.find(".cmfRoleTail pre").text()).toEqual("Hello World");
    });
  });
});
