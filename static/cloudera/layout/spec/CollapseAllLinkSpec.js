// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'underscore',
  'cloudera/layout/CollapseAllLink'
], function(_) {
  describe('CollapseAllLink', function() {
    var $element, $collapsers;

    var getCollapseAllLink = function($element) {
      return $element.data('CollapseAllLink');
    };

    describe('setup', function() {
      beforeEach(function() {
        $element = $('<a href="#" data-collapsible-all-container="#collapsers"></a>').appendTo(document.body);
        $collapsers = $('<div id="collapsers"></div>').appendTo(document.body);
      });

      afterEach(function() {
        $element.remove();
        $collapsers.remove();
      });

      it('extends the jQuery object', function() {
        expect($.fn.CollapseAllLink).toBeDefined();
      });

      it('errors out if there is no data-collapsible-all-container attribute', function() {
        spyOn(window.console, 'error');
        $element.removeAttr('data-collapsible-all-container');
        $element.CollapseAllLink();
        expect(window.console.error).wasCalled();
      });

      it('picks up custom collapse and expand all text from attributes', function() {
        $element.
          data('collapse-text', 'catpants').
          data('expand-text', 'doggyhat');
        $element.CollapseAllLink();
        var collapseAllLink = getCollapseAllLink($element);
        expect(collapseAllLink.collapseText).toEqual('catpants');
        expect(collapseAllLink.expandText).toEqual('doggyhat');
      });
    });

    describe('usage', function() {
      var togglers, collapseAllLink;

      beforeEach(function() {
        $element = $('<a href="#" data-collapsible-all-container="#collapsers"></a>').appendTo(document.body);
        $collapsers = $('<div id="collapsers"></div>').appendTo(document.body);
        togglers = _.map(_.range(5), function(i) {
          var $toggler = $(
            '<a href="#" class="Toggler" data-element-selector=".section" data-element-direction="next">' +
            '<i class="icon-chevron-down"></i>' +
            '</a>').appendTo($collapsers);
          $('<div class="section"></div>').insertAfter($toggler);
          $toggler.Toggler();
          return $toggler;
        });
        // Initialize the plugin.
        $element.CollapseAllLink();
        collapseAllLink = getCollapseAllLink($element);
      });

      afterEach(function() {
        $element.remove();
        $collapsers.remove();
      });

      it('has the I18n text by default', function() {
        expect(collapseAllLink.collapseText).toEqual('ui.collapseAll');
        expect(collapseAllLink.expandText).toEqual('ui.expandAll');
      });

      it('checks collapsed state if a Toggler changes', function() {
        var $toggler = togglers[0];
        // I want to spy on checkAllCollapsed here, but it has been bound to an
        // event handler by now. I know it calls updateText, however, so I'll
        // spy on that to verify functionality.
        spyOn(collapseAllLink, 'updateText');

        expect(collapseAllLink.updateText).wasNotCalled();
        $toggler.trigger('click');
        expect(collapseAllLink.updateText).wasCalled();
      });

      it('changes state if all links are collapsed', function() {
        expect(collapseAllLink.expanded).toBeTruthy();
        _.each(togglers, function($toggler) {
          $toggler.Toggler('hide');
        });
        expect(collapseAllLink.expanded).toBeFalsy();
      });

      it('changes state if link is expanded', function() {
        _.each(togglers, function($toggler) {
          $toggler.Toggler('hide');
        });
        expect(collapseAllLink.expanded).toBeFalsy();
        togglers[0].Toggler('show');
        expect(collapseAllLink.expanded).toBeTruthy();
      });

      it('toggles collapsed and expanded for all on click', function() {
        var allHidden = function() {
          return $collapsers.children('.section').is(':hidden');
        };
        expect(allHidden()).toBeFalsy();
        $element.trigger('click');
        expect(allHidden()).toBeTruthy();
        $element.trigger('click');
        expect(allHidden()).toBeFalsy();
        // Verify the case where one is expanded.
        togglers[0].Toggler('hide');
        $element.trigger('click');
        expect(allHidden()).toBeTruthy();
      });
    });
  });
});
