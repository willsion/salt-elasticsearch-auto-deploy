// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/SessionStorage"
], function(SessionStorage) {
  describe("SessionStorage Tests", function() {

    it("should store a string", function(){
      SessionStorage.setItem("foo", "bar");
      expect(SessionStorage.getItem("foo")).toEqual("bar");
    });

    it("should store a truthy boolean", function(){
      SessionStorage.setItem("foo", true);
      expect(SessionStorage.getItem("foo")).toBeTruthy();
    });

    it("should store a falsy boolean", function(){
      SessionStorage.setItem("foo", false);
      expect(SessionStorage.getItem("foo")).toBeFalsy();
    });

    it("should store a number", function() {
      SessionStorage.setItem("foo", 42);
      expect(SessionStorage.getItem("foo")).toEqual(42);
    });

    it("should store an object", function(){
      SessionStorage.setItem("foo", { key : "bar"});
      expect(SessionStorage.getItem("foo").key).toEqual("bar");
    });

    it("should store an array", function(){
      SessionStorage.setItem("foo", ["bar", "bar2"]);
      expect(SessionStorage.getItem("foo").length).toEqual(2);
    });


    it("should store null", function(){
      SessionStorage.setItem("foo", null);
      expect(SessionStorage.getItem("foo")).toEqual(null);
    });
  });
});
