// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'underscore'
], function(_) {

  /**
   * The scroll bar can be annoying to use, when multiple DOM elements on a
   * given page gets created/destroyed by AJAX operations.
   *
   * This solution uses a reference counting technique to this problem.
   *
   * Before an AJAX operation starts, we increment the reference count
   * via the addRef() method.
   *
   * When the reference count is greater than zero, we also add an invisible
   * div in the background that has the same dimension as the current document.
   *
   * This means the scroll bar will not suddenly jump to somewhere else
   * in the product.
   *
   * After an AJAX operation ends, we decrement the reference count
   * via the release() method.
   *
   * When the reference count is back to zero, we remove the invisible div
   * created above.
   */
  var id = "__ScrollBarStablizer__";

  function getCurrentCount() {
    if (_.isNumber(window._scrollReferenceCount)) {
      return window._scrollReferenceCount;
    } else {
      return 0;
    }
  }

  function setCurrentCount(value) {
    window._scrollReferenceCount = value;
  }

  function createStablizer() {
    var width = $(document).width();
    var height = $(document).height();
    $('<div>').attr("id", id).css({
      "z-index": -1000,
      "position": "absolute",
      "left": 0,
      "top": 0,
      "width": width + "px",
      "height": height + "px",
      "visibility": "hidden"
    }).appendTo(document.body);
  }

  function destroyStablizer() {
    $("#" + id).remove();
  }

  return {
    id: id,

    addRef: function() {
      var current = getCurrentCount();
      if (current === 0) {
        createStablizer();
      }
      setCurrentCount(current + 1);
    },

    release: function() {
      var current = getCurrentCount();
      if (current === 1) {
        destroyStablizer();
      }
      setCurrentCount(current - 1);
    }
  };
});
