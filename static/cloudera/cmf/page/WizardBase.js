// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define(["cloudera/form/DisableAfterClickOnce"], function(DisableAfterClickOnce) {
  return function(options) {
    $("[data-disable-after-click-once=true]").DisableAfterClickOnce();
  };
});
