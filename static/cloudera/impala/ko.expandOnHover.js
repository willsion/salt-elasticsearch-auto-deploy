// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'knockout',
  'underscore'
], function(ko, _) {
  var HOVER_DATA_KEY = 'pre-hover-height';
  var TIMEOUT_DATA_KEY = 'timeout-handle';

  var defaults = {
    hoverSelector: '.default',
    hoverClass: 'hovered',
    measurementSelector: '.measurement'
  };

  var createHoverElementCallback = function($element, options) {
    return function() {
      if (!$element.data(HOVER_DATA_KEY)) {
        $element.data(HOVER_DATA_KEY, $element.height());
      }
      $element.addClass(options.hoverClass);
      $element.animate({
        height: $element.find(options.measurementSelector).height() + 'px'
      }, '0.5s');
    };
  };

  var createOnMouseEnter = function(options) {
    return function() {
      var $this = $(this);
      $this.data(TIMEOUT_DATA_KEY, setTimeout(createHoverElementCallback($this, options), 1500));
    };
  };

  var createOnMouseLeave = function(options) {
    return function() {
      var $this = $(this);
      clearTimeout($this.data(TIMEOUT_DATA_KEY));
      if ($this.hasClass(options.hoverClass)) {
        $this.removeClass(options.hoverClass);
        $this.animate({
          height: $this.data(HOVER_DATA_KEY)
        }, '0.2s');
      }
    };
  };

  // A KO binding that expands a collapsed element after the user hovers over
  // it for half a second. Here's how it works:
  // 1. There's this HTML structure:
  // <ul data-bind="expandOnHover: {...}">
  //   <li><div class="measurement"></div></li>
  //   <li><div class="measurement"></div></li>
  //   ...etc...
  // </ul>
  // 2. The expandOnHover binding has its hoverSelector set to 'li', its
  //    hoverClass as 'hovered', and its measurementSelector as '.measurement'.
  // 3. The user hovers over an <li> for 0.5s.
  // 4. The hoverClass is added to the <li>.
  // 5. CSS declarations cause the .measurement class to have a set height of,
  //    say, 200px.
  // 6. The expandOnHover binding uses that height to set the height of the
  //    containing <li>. The expandOnHover binding animates the height change.
  //
  // Options:
  // * hoverSelector: the selector to select the hoverable things (e.g. the <li>s
  //   in the example above)
  // * hoverClass: the name of the class to add to the hovered elements (e.g.
  //   a value of "hovered" will make the <li>s be <li class="hovered"></li>
  //   when the row is hovered).
  // * measurementSelector: the selector the binding will use to set the height of the
  //   containing element.
  ko.bindingHandlers.expandOnHover = {
    init: function(element, valueAccessor) {
      var options = _.defaults(valueAccessor(), defaults);
      var $element = $(element);
      $element
        .on('mouseenter', options.hoverSelector, createOnMouseEnter(options))
        .on('mouseleave', options.hoverSelector, createOnMouseLeave(options));
    }
  };
});