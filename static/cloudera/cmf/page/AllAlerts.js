// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define(["cloudera/layout/PopupLink"], function(PopupLink) {
  return function(options) {

    // Show different set of alerts
    // when we click on a section
    // header in the menu (i.e. "Services").
    $('.selector').click(function(e) {
      var $this = $(this);

      $('.alertsTable').addClass('hidden');

      $('#' + $this.data('selector-target'))
        .removeClass('hidden')
        .find('tbody')
          .removeClass('hidden');

      $('.selector .floatRight').addClass('hidden');
      $this.find('.floatRight').removeClass('hidden');
      
      // remove highlighting from all drill downs
      $('.drillDown').removeClass('selected');

      // Close all accordions and open
      // the one we just clicked on.
      $('.accordionBody').addClass('hidden');
      $('#' + $this.data('accordion-target')).removeClass('hidden');
    });

    // Show only relevant table section
    // when link in an accordion (i.e.
    // "hdfs1") is clicked on.
    $('.drillDown').click(function(e) {
      var $this = $(this);
      var $target = $("#" + $this.data("target"));
      $target.parents('table.alertsTable').find('tbody').addClass('hidden');
      $target.removeClass('hidden');

      // remove highlighting from all but selected drillDown
      $('.drillDown').removeClass('selected');
      $this.addClass('selected');

    });

    // add popup for test alert
    $('.PopupLink').PopupLink();
  };
});
