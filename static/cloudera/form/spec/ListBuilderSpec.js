// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/form/ListBuilder"
], function(ListBuilder) {

describe("ListBuilder Tests", function() {

  it("ListBuilder Test 1", function() {
    var options = {
      values: []
    };
    var listBuilder = new ListBuilder(options);
    expect(listBuilder.values().length).toEqual(1);

    listBuilder.values.removeAll();
    expect(listBuilder.values().length).toEqual(0);

    var value = listBuilder.newEntry("abc");

    listBuilder.values.push(value);
    expect(value.hasSiblings()).toEqual(false);

    value.insertBelow();
    expect(value.hasSiblings()).toEqual(true);

    value.removeSelf();
    expect(value.hasSiblings()).toEqual(false);
  });

  it("ListBuilder Test 2", function() {
    var options = {
      values: ['a','b']
    };
    var listBuilder = new ListBuilder(options);
    expect(listBuilder.values().length).toEqual(2);
  });

  it("ListBuilder Test 3", function() {
    var options = {
      values: ['a','b'],
      separator: "\n"
    };
    var listBuilder = new ListBuilder(options);
    expect(listBuilder.separator).toEqual("\n");
    expect(listBuilder.values().length).toEqual(2);
  });

});
});
