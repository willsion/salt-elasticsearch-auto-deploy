// Copyright (c) 2011-2012 Cloudera, Inc.  All rights reserved.
define([], function() {
  jQuery.fn.autoExpand = function(options) {

    var $this = this;

    var o = {
      // initial width of input
      'minWidth': $this.width(),
      // min distance after text in px
      'buffer': 20,
      // character limit
      'charLimit': 10000
    };

    $.extend(o, options);

    return $this.each(function() {
      // copy styles from input and
      // absolutely position off the page
      $this.attr('maxLength', o.charLimit);
      var test = $('<div />')
        .css({
            'position': 'absolute',
            'top': -10000,
            'left': -10000,
            'width': 'auto',
            'whiteSpace': 'nowrap',
            'fontFamily': $this.css('fontFamily'),
            'fontSize': $this.css('fontSize'),
            'fontStyle': $this.css('fontStyle'),
            'fontVariant': $this.css('fontVariant'),
            'fontWeight': $this.css('fontWeight'),
            'letterSpacing': $this.css('letterSpacing')
        });

      // sets the proper width of the input
      var setSize = function(e) {
        test.html($(e.target).val());
        var testBufferWidth = test.width() + o.buffer;
        if (testBufferWidth > o.minWidth) {
          $this.width(testBufferWidth);
        } else {
          $(this).width(o.minWidth);
        }
      };

      test.insertAfter(this);
      $this.bind('update blur keyup keydown', setSize);
    });
  };
});
