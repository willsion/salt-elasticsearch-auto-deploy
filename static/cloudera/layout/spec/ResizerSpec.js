// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/layout/Resizer'
], function(Resizer) {

  describe("Resizer Tests", function() {
    var id = "someResizer";

    beforeEach(function() {
      $('<div id="' + id + '"/>').appendTo("body");
    });

    afterEach(function() {
      $("#" + id).remove();
    });

    it("should create a Resizer element and fire a slide event", function() {
      var scale;
      var resizer = new Resizer({
        element: "#" + id,
        min: 100,
        max: 200,
        callback: function(value) {
          scale = value;
        }
      });

      resizer.slide("dontcare", {
        value: 150
      });
      expect(scale).toEqual(150);
    });

    it("should create a Resizer element not call callback", function() {
      var scale;
      var resizer = new Resizer({
        element: "#" + id,
        min: 100,
        max: 200,
        callback: function(value) {
          scale = value;
        }
      });

      try {
        resizer.slide("dontcare", {
          value: 300
        });
      } catch (ex) {
        expect(ex).toEqual("scale out of range: 300");
      }
    });
  });
});
