// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/**
 * Renders cell data in the file search result table.
 */
define([
  "cloudera/Util",
  "cloudera/common/Humanize",
  "cloudera/common/I18n",
  "cloudera/cmf/include/DataTableColumnRenderer",
  "cloudera/headlamp/hdfs/rwx"
], function(Util, Humanize, I18n, DataTableColumnRenderer, rwx) {

  /**
   * Given a path, return just the name.
   * if there is no /, return the whole thing.
   * e.g. a/b/c gives a/b.
   * e.g. a/b/, return "".
   */
  var getName = function(path) {
    if (path === "/") {
      return "/";
    } else {
      var lastSlashPos = path.lastIndexOf("/");
      return path.substring(lastSlashPos + 1);
    }
  };

  /**
   * given a/b/c, return a/b.
   * if ends with /, just remove /.
   * e.g. a/b/, return "a/b".
   * if there is no /, return ""
   */
  var getPrefix = function(path) {
    var lastSlashPos = path.lastIndexOf("/");
    if (lastSlashPos === -1) {
      return "";
    }
    var prefix = path.substring(0, lastSlashPos);
    if (prefix === "") {
      // "/" was the first character.
      prefix = "/";
    }
    return prefix;
  };

  /**
   * Returns the parent directory of a given path.
   */
  var getParentDirectory = function(path) {
    return getName(getPrefix(path));
  };

  var isDirectory = function(aData) {
    return rwx.rwxtype(aData.mode) === 'd';
  };

  var renderWatchedDir = function(aData, watchedDirsManager) {
    if (isDirectory(aData)) {
      return watchedDirsManager.renderIcon(aData.path);
    } else {
      return "";
    }
  };

  var renderDirectoryIcon = function() {
    return '<i class="icon-folder-close"></i>';
  };

  var renderDocumentIcon = function() {
    return '<i class="icon-file"></i>';
  };

  var renderNameText = function(aData) {
    return getName(aData.path);
  };

  var renderNameHtml = function(aData) {
    var name = getName(aData.path);
    var label = Util.truncate(name, 20);

    if (isDirectory(aData)) {
      var url = "?path=" + aData.path;
      return renderDirectoryIcon() +
        DataTableColumnRenderer.renderLink(url, label, name);
    } else {
      return renderDocumentIcon() + label;
    }
  };

  var renderParent = function(aData) {
    var name = getParentDirectory(aData.path);
    var label = Util.truncate(name, 20);
    var url = "?path=" + getPrefix(aData.path);
    return renderDirectoryIcon() +
      DataTableColumnRenderer.renderLink(url, label, name);
  };

  var renderDiskspace = function(aData) {
    var diskspaceQuota = aData.diskspaceQuota;
    var rawSize = aData.rawSize;
    var content;
    if (Util.isDefined(diskspaceQuota) && diskspaceQuota !== -1) {
      content = DataTableColumnRenderer.renderUsedTotal(rawSize,
          diskspaceQuota, "bytes");
    } else {
      content = Humanize.humanizeBytes(rawSize);
    }
    var clazz = "";
    if (isDirectory(aData)) {
      clazz = "diskspaceQuota";
    }
    var $div = $("<div/>").addClass(clazz)
      .html(content);
    return $("<div/>").html($div).html();
  };

  var renderNamespace = function(aData) {
    var namespaceQuota = aData.namespaceQuota;
    var fileCount = aData.fileCount;
    var content;
    if (Util.isDefined(namespaceQuota) && namespaceQuota !== -1) {
      content = DataTableColumnRenderer.renderUsedTotal(fileCount,
          namespaceQuota, "");
    } else {
      content = fileCount;
    }

    var clazz = "";
    if (isDirectory(aData)) {
      clazz = "namespaceQuota";
    }
    var $div = $("<div/>").addClass(clazz)
      .html(content);
    return $("<div/>").html($div).html();
  };

  /**
   * Renders the cell that contains the actions menu.
   */
  var renderActionsMenu = function(aData) {
    if (isDirectory(aData)) {
      var $icon = $("<i>").addClass("icon-edit");
      var $button = $("<button>")
        .addClass("btn manageQuota")
        .append($icon)
        .append(" ")
        .append(I18n.t("ui.manageQuota"));
      return $("<span>").append($button).html();
    } else {
      return "";
    }
  };

  return {
    renderNameHtml: renderNameHtml,
    renderNameText: renderNameText,
    renderParent: renderParent,
    getName: getName,
    getPrefix: getPrefix,
    getParentDirectory: getParentDirectory,
    renderDiskspace: renderDiskspace,
    renderNamespace: renderNamespace,
    renderWatchedDir: renderWatchedDir,
    renderActionsMenu: renderActionsMenu
  };
});
