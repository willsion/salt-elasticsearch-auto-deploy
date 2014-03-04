// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/common/I18n"
], function(I18n) {
  if ($.validator && !$.isFunction($.validator.methods.repository)) {
    $.validator.addMethod("repository", function(value, element) {
      if (value !== "") {
        if (value.indexOf(" ") === -1) {
          // non-debian repository setting: a straight URL.
          // $.validator.methods.url only supports (https?|ftp), and
          // it fails on non fully-qualified names (like http://repo/),
          // which is troublesome in our environments.  Hence,
          // we explicitly allow anything that starts out like a URL.
          return (value.indexOf("file:///") === 0) ||
                 (value.indexOf("http://") === 0) ||
                 (value.indexOf("https://") === 0) ||
                 (value.indexOf("ftp://") === 0);
        } else {
          // Debian repository setting:
          // deb url distribution [component]
          var parts = value.split(" ");
          return parts[0] === "deb" && parts.length >= 4;
        }
      }
    }, I18n.t("ui.validator.repository"));
  }
});
