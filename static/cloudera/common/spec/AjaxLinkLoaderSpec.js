// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/AjaxLinkLoader'
], function(AjaxLinkLoader) {
  describe("AjaxLinkLoader Tests", function() {
    var module;

    beforeEach(function() {
      module = new AjaxLinkLoader();
    });

    afterEach(function() {
      $("#" + module.id).remove();
    });

    it("should create a hidden element", function() {
      var $elem = $("#" + module.id);
      expect($elem.length).toEqual(1);
      expect($elem.hasClass("AjaxLink")).toBeTruthy();
      expect($elem.hasClass("hidden")).toBeTruthy();
    });

    it("should trigger an ajax load", function() {
      var location = {
        search: "?ajaxUrl=foo%20bar"
      };
      spyOn($.fn, "trigger");
      module.loadAjaxUrlFromLocation(location);
      expect($("#" + module.id).attr("href")).toEqual("foo bar");
      expect($.fn.trigger).wasCalled();
    });
  });
});
