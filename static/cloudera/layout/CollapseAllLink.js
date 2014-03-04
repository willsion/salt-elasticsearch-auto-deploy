// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/common/I18n',
  'underscore'
], function(I18n, _) {

  var CollapseAllLink = function(element) {
    var self = this;
    self.$element = $(element);
    var allContainerSelector = self.$element.data('collapsible-all-container');
    if (!allContainerSelector) {
      console.error('Must include collapsible-all-container: ', element);
      return;
    }

    self.$allContainer = $(allContainerSelector);
    self.collapseText = self.$element.data('collapse-text') || I18n.t('ui.collapseAll');
    self.expandText = self.$element.data('expand-text') || I18n.t('ui.expandAll');

    self.updateText = function() {
      self.$element.html(self.expanded ? self.collapseText : self.expandText);
    };

    var getTogglers = function() {
      return self.$allContainer.find('.Toggler');
    };

    self.checkAllCollapsed = function() {
      var $togglers = getTogglers();
      var numCollapsed = $togglers.find('.icon-chevron-right').size();
      if (numCollapsed === $togglers.length) {
        self.expanded = false;
      } else {
        self.expanded = true;
      }
      self.updateText();
    };

    // As togglers are clicked we need to keep track so we can keep our own
    // expanded state in sync correctly.
    self.$allContainer.on('toggled', self.checkAllCollapsed);

    self.collapseAll = function() {
      getTogglers().Toggler('hide');
      self.expanded = false;
      self.$element.html(self.expandText);
    };

    self.expandAll = function() {
      getTogglers().Toggler('show');
      self.expanded = true;
      self.$element.html(self.collapseText);
    };

    self.checkAllCollapsed();

    self.click = function() {
      (self.expanded ? self.collapseAll : self.expandAll).call(self);
      return false;
    };

    self.$element.on('click.collapsealllink', self.click);
  };

  // Add to the jQuery object.
  $.fn.CollapseAllLink = function(option) {
    return this.each(function() {
      var $this = $(this),
      data = $this.data('CollapseAllLink');

      if (!data) {
        data = new CollapseAllLink(this);
        $this.data('CollapseAllLink', data);
      }

      // If we were given a string, try to run it as a command.
      if (_.isString(option)) {
        var func = data[option];
        if (_.isFunction(func)) {
          func.call(data);
        }
      }
    });
  };
});
