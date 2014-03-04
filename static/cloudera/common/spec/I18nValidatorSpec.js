// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/common/I18nValidator"
], function(I18nValidator) {

describe("I18nValidator Tests", function() {
  it("should translated validator strings.", function() {
    expect($.validator.messages.required).toEqual("This field is required.");
  });
});
});
