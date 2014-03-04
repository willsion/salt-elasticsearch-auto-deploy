// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/CommandDetailsContent'
], function(CommandDetailsContent) {
  describe("CommandDetailsContent Tests", function() {
    var id = "commandDetailsContent", module;

    beforeEach(function() {
      $("<div>").attr("id", id).appendTo(document.body);
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should initialize CommandDetailsContent", function() {
      $("#" + id)
        .append('<div class="child-commands-title" data-command-id="FOO" style="display: none"/>')
        .append('<div class="child-commands-content" data-command-id="FOO" style="display: none"/>');

      module = new CommandDetailsContent({
        commandId: "FOO",
        isSummaryEmpty: true
      });

      expect($("#" + id).find(".child-commands-title").is(":visible")).toBeTruthy();
    });
  });
});
