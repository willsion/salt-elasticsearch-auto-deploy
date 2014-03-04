// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/TestUtil",
  "cloudera/headlamp/hdfs/include/FileSearchResultColumnRenderer"
], function(TestUtil, FileSearchResultColumnRenderer) {

describe("FileSearchResultColumnRenderer Tests", function() {

  function compareHTML(html1, html2) {
    var diffs = TestUtil.compareHTML(html1, html2);
    expect(diffs).toEqual([]);
  }

  var check = function(inputsAndOutputs, func) {
    var i, path, actual, expected;
    for (i = 0; i < inputsAndOutputs.length; i+=1) {
      path = inputsAndOutputs[i][0];
      expected = inputsAndOutputs[i][1];
      actual = func(path);
      if (expected.indexOf("<") === 0) {
        compareHTML(actual, expected);
      } else {
        expect(actual).toEqual(expected);
      }
    }
  };

  it("should check getName", function() {
    var inputsAndOutputs = [
      ["a/b/c", "c"],
      ["a/b/", ""],
      ["a", "a"],
      ["/", "/"]
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.getName);
  });

  it("should check getPrefix", function() {
    var inputsAndOutputs = [
      ["a/b/c", "a/b"],
      ["a/b/", "a/b"],
      ["a", ""],
      ["/", "/"],
      ["/tmp", "/"]
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.getPrefix);
  });

  it("should check getParentDirectory", function() {
    var inputsAndOutputs = [
      ["a/b/c", "b"],
      ["a/b/", "b"],
      ["a", ""],
      ["/", "/"]
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.getParentDirectory);
  });

  var aDirData = {
    atime: 15655,
    diskspaceQuota: -1,
    fileCount: 3,
    group: "supergroup",
    mode: 16877,
    mtime: 1341319695654,
    namespaceQuota: -1,
    owner: "hdfs",
    path: "/user",
    rawSize: 0,
    size: 0
  };

  var aFileData = {
    atime: 1341319636817,
    diskspaceQuota: -1,
    fileCount: 1,
    group: "hbase",
    mode: 33188,
    mtime: 1341319636817,
    namespaceQuota: -1,
    owner: "hbase",
    path: "/hbase/hbase.version",
    rawSize: 9,
    size: 3
  };

  it("should render the filename", function() {
    var inputsAndOutputs = [
      [aDirData, '<i class="icon-folder-close"></i><a href="?path=/user" title="user">user</a>']
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderNameHtml);
  });

  it("should render the filename text only", function() {
    var inputsAndOutputs = [
      [aDirData, 'user']
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderNameText);
  });

  it("should render the parent directory", function() {
    var inputsAndOutputs = [
      [aDirData, '<i class="icon-folder-close"></i><a href="?path=/" title="/">/</a>']
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderParent);
  });

  it("should render the diskspace cell", function() {
    var inputsAndOutputs = [
      [aDirData, '<div class="diskspaceQuota">0 B</div>'],
      [aFileData, '<div>9 B</div>']
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderDiskspace);
  });

  it("should render the namespace cell", function() {
    var inputsAndOutputs = [
      [aDirData, '<div class="namespaceQuota">3</div>'],
      [aFileData, '<div>1</div>']
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderNamespace);
  });

  it("should render the watched dir icon for directory only", function() {
    var inputsAndOutputs = [
      [aDirData, "dummyRenderIconOutput"],
      [aFileData, ""]
    ];
    var mockWatchedDirManager = {
      renderIcon: function(aData) {
        return "dummyRenderIconOutput";
      }
    };
    var func = function(aData) {
      return FileSearchResultColumnRenderer.renderWatchedDir(aData, mockWatchedDirManager);
    };
    check(inputsAndOutputs, func);
  });

  it("should render the actions menu", function() {
    var inputsAndOutputs = [
      [aDirData, '<button class="btn manageQuota"><i class="icon-edit"></i> Manage Quota</button>'],
      [aFileData, ""]
    ];
    check(inputsAndOutputs, FileSearchResultColumnRenderer.renderActionsMenu);
  });
});
});
