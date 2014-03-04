// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of finding a form from a specific element.
 */
define([
], function() {

  $.fn.ElementFinder = function () {
    var $this = $(this);

    // data-element-direction: could be "" (global, default), "next", "prev", "ancestor"
    // data-element-selector: the jQuery selector.
    var elementDirection = $this.attr("data-element-direction");
    var elementSelector = $this.attr("data-element-selector");

    if (elementDirection === undefined && elementSelector === undefined) {
      return null;
    }

    var $element = null;
    if (elementDirection === 'next') {
      $element = $this.next(elementSelector);
    } else if (elementDirection === 'prev') {
      $element = $this.prev(elementSelector);
    } else if (elementDirection === 'ancestor') {
      $element = $this.parents(elementSelector);
    } else {
      $element = $(elementSelector);
    }
    $this = null;
    return $element;
  };

  return $.fn.ElementFinder;
});
