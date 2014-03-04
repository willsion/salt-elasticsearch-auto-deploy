// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "underscore"
], function (Util, _)  {

  /**
   * options = {
   *   selectedView:  (optional) the selected view.
   *   saveUrl:       (optional) "the URL to update the view with the local selectedView.",
   *   returnUrl:     (optional) "the URL to return to after the save is complete.",
   *   searchInputElement: (required) the DOM element or selector for the search input box.
   *   searchClearElement: (optional) the DOM element or selector for the clear search button.
   * };
   */
  return function ExhaustiveViewContainer(options) {
    var self = this;
    self.selectedView = options.selectedView;
    self.oldQuery = "";

    /**
     * Respond to plot selection.
     *
     * Note I am using isEqual below right now. This is actually not ideal,
     * and I might have to write a different function instead.
     * It is not ideal because of the way we handle the plot objects.
     *
     * When we get a plot object from the server side, it contains a set of
     * attributes. On the client side, just before we render it,
     * we actually decorate it using a bunch of properties
     * (e.g. actual width, actual height).
     *
     * This works now because the exhaustive view is read only. We currently
     * don't try to change anything at runtime (e.g. width/height, etc).
     */
    var handle1 = $.subscribe("selectPlot", function(plot) {
      if (self.selectedView) {
        var found = false;
        _.each(self.selectedView.plots, function(selectedPlot, i) {
          if (_.isEqual(plot, selectedPlot)) {
            found = true;
          }
        });
        if (!found) {
          self.selectedView.plots.push(plot);
        }
      }
    });

    /**
     * Respond to plot de-selection.
     * Note I am using isEqual below right now. This is actually not ideal,
     * and I might have to write a different function instead.
     */
    var handle2 = $.subscribe("unselectPlot", function(plot) {
      if (self.selectedView) {
        var foundIndex;
        _.each(self.selectedView.plots, function(selectedPlot, i) {
          if (_.isEqual(plot, selectedPlot)) {
            foundIndex = i;
          }
        });
        if (foundIndex !== undefined) {
          self.selectedView.plots.splice(foundIndex, 1);
        }
      }
    });

    /**
     * This is kinda hacky, and I think the correct way is to improve
     * the Toggler's API.
     */
    var hideSectionsWithNoMatches = function(hasSearchQuery) {
      // Make the section disappear if there are no charts.
      $.each($(".chart-section"), function(i, section) {
        var $section = $(section);

        // Always start assuming the section will be shown.
        // This is needed to expand the section if already collapsed.
        // This is necessary because otherwise a previously hidden
        // section won't know if it needs to be expanded or not.
        $section.show();

        if (hasSearchQuery) {
          // When user entered something in the search input box,
          // Expand all collapsed sections.
          $section.find(".Toggler > .icon-chevron-right").trigger("click");
        }

        // If there are no visible charts, hide this section.
        if ($section.find(".charts-container h2:visible").length === 0) {
          $section.hide();
        }
      });
    };

    /**
     * Called when the search input string is changed.
     */
    self.onSearchChanged = function() {
      var query = $.trim($(options.searchInputElement).val());
      if (self.oldQuery !== query) {
        $.publish("searchChanged", [query]);
        self.oldQuery = query;
        hideSectionsWithNoMatches(!_.isEmpty(query));
      }
    };
    $(options.searchInputElement).keyup(_.debounce(self.onSearchChanged, 500)).focus();
    $(options.searchClearElement).click(function() {
      $(options.searchInputElement).val("").trigger("keyup");
    });

    self.save = function() {
      if (self.selectedView) {
        var urlParams = {
          "viewJson": JSON.stringify(self.selectedView)
        };
        $.post(options.saveUrl, urlParams, function(response) {
          if (response.message === 'OK') {
            Util.setWindowLocation(options.returnUrl);
          } else {
            $.publish("showError", [response.message]);
          }
        });
      }
    };

    $(".save-selection-btn").click(self.save);

    self.subscriptionHandles = [handle1, handle2];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };
  };
});
