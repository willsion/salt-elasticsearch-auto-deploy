// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
/**
 * jQuery's implementation of toggling the display of another element.
 */
define([
  "cloudera/layout/ElementFinder"
], function(ElementFinder) {

  var Toggler = function (element) {
    this.$element = $(element);
    // use ElementFinder to identify the target.
    // data-element-direction="..."
    // data-element-selector="..."
    this.$target = this.$element.ElementFinder();

    var arrowClass = "icon-chevron-right";

    // Example 1:
    // <a href="#" data-element-direction="next" data-element-selector="ul">
    //   <i class="icon-chevron-right"></i>Some Link that would toggle the ul
    // </a>
    // <ul style="display:none">
    //    <li>...</li>
    // </ul>
    // displays:
    // > Some Link that would toggle the ul
    //
    // Example 2:
    // <a href="#" data-element-direction="next" data-element-selector="ul">
    //   Some Link that would toggle the ul. <i class="icon-chevron-down"></i>
    // </a>
    // <ul>
    //    <li>...</li>
    // </ul>
    // displays:
    // Some Link that would toggle the ul v
    //
    // Example 3:
    // <a href="#" data-element-direction="next" data-element-selector="ul">
    //   Some Link that would toggle the ul. <i class="icon-chevron-right"></i>
    // </a>
    // <ul style="display:none">
    //    <li>...</li>
    // </ul>
    // displays:
    // Some Link that would toggle the ul <
    this.onclick = function(evt) {
      if (this.$target) {
        if (this.$target.is(":visible")) {
          this.hide();
        } else {
          this.show();
        }
      }

      // publish an event on toggle.  see OPSAPS-7419.
      $.publish("toggle", [this.$element]);

      if (evt) {
        evt.preventDefault();
      }
    };

    this.hide = function() {
      this.$element.find(".icon-chevron-down").removeClass("icon-chevron-down").addClass(arrowClass);
      this.$target.hide();
      this.$element.trigger("toggled");
    };

    this.show = function() {
      this.$element.find("." + arrowClass).removeClass(arrowClass).addClass("icon-chevron-down");
      this.$target.show();
      this.$element.trigger("toggled");
    };
  };

  $.fn.Toggler = function (option, event) {
    return this.each(function () {
      var $this = $(this),
      data = $this.data('Toggler');

      if (!data) {
        $this.data('Toggler', (data = new Toggler(this)));
      }

      if (option === 'click') {
        data.onclick(event);
      } else if (option === 'hide') {
        data.hide();
      } else if (option === 'show') {
        data.show();
      }
    });
  };

  return $.fn.Toggler;
});
