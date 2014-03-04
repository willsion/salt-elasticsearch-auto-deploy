// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/headlamp/hdfs/rwx"
], function(rwx) {

describe("rwx Tests", function() {

  it("should display the mode using rwx", function() {
    expect(rwx.rwx(16877)).toEqual("drwxr-xr-x");
    expect(rwx.rwx(17407)).toEqual("drwxrwxrwx");
    expect(rwx.rwx(33188)).toEqual("-rw-r--r--");
  });

  it("should calculate the rwxtype using rwx", function() {
    expect(rwx.rwxtype(16877)).toEqual("d");
    expect(rwx.rwxtype(17407)).toEqual("d");
    expect(rwx.rwxtype(33188)).toEqual("-");
  });

  it("should calculate the filetype using rwx", function() {
    expect(rwx.filetype(16877)).toEqual("dir");
    expect(rwx.filetype(17407)).toEqual("dir");
    expect(rwx.filetype(33188)).toEqual("file");
  });
});
});
