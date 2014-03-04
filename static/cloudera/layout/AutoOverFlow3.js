// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation which dynamically sets the height of a div so scrolling, if any, appears
 * inside the div.
 */
define([], function() {

// This is necessary because some measurement calls were
// returning NaN in IE sometimes instead of 0.
// As a result, height becomes NaN.
var ensureNonNegative = function (value) {
  if ($.isNumeric(value) && value > 0) {
    return value;
  } else {
    return 0;
  }
};

var forceResize = function(obj) {
  var $obj = $(obj);
  var opts = $obj.data("AutoOverFlow3");
  var parentsUntil = opts.parentsUntil;
  // outerHeight(true) includes margin.
  var height = $(parentsUntil).height();
  height -= $obj.outerHeight(true) - $obj.innerHeight();

  // Apparently if the element is not visible,
  // $.position() does not return a correct value.
  if ($obj.is(":visible")) {
    var top = ensureNonNegative($obj.position().top);
    height -= top;
  }
  var $parents = $obj.parentsUntil(parentsUntil);
  $parents.each(function(i, parent) {
    var $parent = $(parent);
    var bottomMarginBottom = ensureNonNegative(parseInt($parent.css("margin-bottom"), 10));
    var bottomPaddingBottom = ensureNonNegative(parseInt($parent.css("padding-bottom"), 10));
    var bottomBorderWidth = ensureNonNegative(parseInt($parent.css("border-bottom-width"), 10));
    height -= bottomMarginBottom;
    height -= bottomPaddingBottom;
    height -= bottomBorderWidth;
  });
  if (opts.footer) {
    var $footer = $("#" + opts.footer);
    var footerHeight = ensureNonNegative($footer.outerHeight(true));
    height -= footerHeight;
  }
  $obj.height(height + "px");
};

var methods = {
  init : function(options) {

    // This function is taken from Util.
    // Copied here so there is no dependency.
    var throttle = function(fn, delay) {
      var timer = null;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
          }, delay);
      };
    };

    return this.each(function(){
      var $this = $(this);
      $this.css("overflow-y", "auto");
      $this.data("AutoOverFlow3", jQuery.extend({}, jQuery.fn.AutoOverFlow3.defaults, options));

      var resizeHelper = function() {
        forceResize($this);
      };

      // Resize once initially.
      resizeHelper();
      // content update won't keep up with real time browser resize.
      // throttle the resize callback to make the UI more responsive.
      var throttledResize = throttle(resizeHelper, 200);
      $(window).resize(throttledResize);
    });
  },

  forceResize: function() {
    return this.each(function(){
      forceResize($(this));
    });
  }

};

jQuery.fn.AutoOverFlow3 = function(method) {
  if(methods[method]) {
    return methods[method].apply(this, Array.prototype.slice.call(arguments,1));
  } else if (typeof method === 'object' || !method) {
    return methods.init.apply(this, arguments);
  } else {
    $.error('Method ' + method + ' does not exist on jQuery.AutoOverFlow3');
  }
};

jQuery.fn.AutoOverFlow3.defaults = {
  parentsUntil: window
};
});
