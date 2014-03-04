// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of turning regular links into a form post.
 */
define([
  "cloudera/layout/FormFinder"
], function(FormFinder) {

  var FormSubmitLink = function (element) {
    this.$element = $(element);

    this.onclick = function (evt) {
      var $link = this.$element;
      var $form = $link.FormFinder();

      try {
        $form.submit();
      } catch (ex) {
        console.log(ex);
      }

      if (evt) {
        evt.preventDefault();
      }

      $link = null;
      $form = null;
    };
  };

  $.fn.FormSubmitLink = function (option) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data('FormSubmitLink'),
        onclick = function (evt) {
          data.onclick(evt);
        };

      if (!data) {
        $this.data('FormSubmitLink', (data = new FormSubmitLink(this)));
      }

      /**
       * Simulates a click event.
       */
      if (option === 'click') {
        data.onclick(null);
      }
    });
  };

  return $.fn.FormSubmitLink;
});
