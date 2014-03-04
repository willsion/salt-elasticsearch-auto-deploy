// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/cmf/include/RepositoryValidator"
], function(RepositoryValidator) {
  describe("RepositoryValidator tests", function() {
    var $form, $input;

    beforeEach(function() {
      $form = $("<form>");
      $input = $("<input>").attr("type", "text").attr("name", "myRepos");
      $form.append($input);
      $form.validate({
        rules: {
          myRepos: "repository"
        }
      });
    });

    it("should find the form to be valid", function() {
      $input.val("http://www.example.com");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form with a short hostname valid", function() {
      $input.val("http://shorthost/");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form with a short hostname valid (ftp version)", function() {
      $input.val("ftp://shorthost/");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form with a short hostname valid (https version)", function() {
      $input.val("https://shorthost/");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form with username/pass to be valid", function() {
      $input.val("http://user:pass@www.example.com");
      expect($form.valid()).toBeTruthy();
    });

    it("should find file URLs to be valid", function() {
      $input.val("file:///tmp/repo");
      expect($form.valid()).toBeTruthy();
    });

    it("should find file URLs to be valid (short paths ok too)", function() {
      $input.val("file:///tmp");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form to be invalid because myRepos is not a URL", function() {
      $input.val("blah");
      expect($form.valid()).toBeFalsy();
    });

    it("should find the form to be invalid because the second part of myRepos is not a URL", function() {
      $input.val("deb blah");
      expect($form.valid()).toBeFalsy();
    });

    it("should find the form to be invalid because there are only 3 parts in myRepos", function() {
      $input.val("deb http://www.example.com blah");
      expect($form.valid()).toBeFalsy();
    });

    it("should find the form to be valid because there are optional parameters in myRepos", function() {
      $input.val("deb [ options ] http://www.example.com blah");
      expect($form.valid()).toBeTruthy();
    });

    it("should find the form to be valid because there is a deb, a uri, a distribution, and a component", function() {
      $input.val("deb http://www.example.com dist contrib");
      expect($form.valid()).toBeTruthy();
    });
  });
});
