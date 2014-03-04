// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of finding a form from a specific element.
 */
define([
  "cloudera/Util"
], function(Util) {

  $.fn.FormFinder = function () {
    var $this = $(this);
    var defaults = {
      formSelector: "form",
      formDirection: ""
    };

    // data-form-direction: could be "" (global, default), "next", "prev", "ancestor"
    // data-form-selector: the jQuery selector, default "form"
    var formDirection = $this.attr("data-form-direction");
    var formSelector = $this.attr("data-form-selector");

    if (formDirection === undefined && formSelector === undefined) {
      return [];
    }

    formDirection = formDirection || defaults.formDirection;
    formSelector = formSelector || defaults.formSelector;

    var $form = [];
    if (formDirection === 'next') {
      $form = $this.next(formSelector);
    } else if (formDirection === 'prev') {
      $form = $this.prev(formSelector);
    } else if (formDirection === 'ancestor') {
      $form = $this.parents(formSelector);
    } else {
      $form = $(formSelector);
    }
    $this = null;
    return $form;
  };

  return $.fn.FormFinder;
});
