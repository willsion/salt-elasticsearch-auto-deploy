// (c) Copyright 2013 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/common/UrlParams',
  'cloudera/cmf/CmfPath',
  'underscore',
  'knockout',
  'komapping',
  'cloudera/cmf/parcel/ClusterModel',
  'cloudera/common/I18n'
], function(Util, UrlParams, CmfPath, _, ko, komapping, ClusterModel, I18n) {

  /**
   * The JavaScript for the Parcels Usage page.
   *
   * options = {
   *   container:             (required) The selector for the main content element,
   *   headerContainer:       (required) The selector for the header element,
   *   hostPopoverContainer:  (required) the selector for the host popover content element,
   *   clusters               (required) Array of cluster hashes
   * }
   *
   * Cluster hash format: {
   *   id: 1,
   *   name: 'Cluster 1',
   *   fetchUrl: '/cmf/...'
   * }
   *
   */
  return function(options) {
    var self = this;
    var appliedBindings = false;
    var $container = $(options.container);
    var $headerContainer = $(options.headerContainer);
    var $hostPopoverContainer = $(options.hostPopoverContainer);

    self.clusters = options.clusters;
    self.isLoading = ko.observable(false);
    self.hasClusters = ko.observable(self.clusters.length > 0);
    self.selectedHost = ko.observable();
    self.usesParcels = ko.observable(true);
    self.subscriptionHandles = [];

    // Apply bindings for just the header here so that loading spinner works. 
    // Bindings for the filter and content areas are applied once we receive 
    // data from the server.
    ko.applyBindings(self, $headerContainer[0]);

    // Loads the cluster information from the server for the selectedCluster.
    self.loadData = function() {
      self.hidePopovers();
      self.isLoading(true);

      $.ajax({
        type: 'GET',
        url: self.selectedCluster().fetchUrl,
        success: self.updateClusterModel,
        error: self.ajaxError,
        complete: function() {
          self.isLoading(false);
        },
        dataType: 'json'
      });
    };

    // Update the clusterModel with the new cluster data.
    self.updateClusterModel = function(response) {
      if (response.message !== 'OK') {
        self.clusterModel.update();
        $.publish('showError', [response.message]);
        return;
      }
      self.usesParcels(response.data.parcels.length > 0);
      self.clusterModel.update(response.data);
      self.selectedHost(null);
      if (!self.clusterModel.hasProduct(self.filters.productName())) {
        // Current product doesn't apply to this cluster, default to the first product
        var firstProduct = self.clusterModel.firstProduct();
        var firstProductName = firstProduct ? firstProduct.name : null;
        self.filters.productName(firstProductName);
      }
      // Apply bindings to the main container only after the data for the first
      // cluster is downloaded. Otherwise, once the bindings are applied filters
      // try to overwrite the filter parameters gathered from the url.
      if (!appliedBindings) {
        ko.applyBindings(self, $container[0]);
        appliedBindings = true;
      }
      self.registerForPopoverEvents();
      self.updateSelectedVersions();
      $('.rackTooltip').tooltip();
    };

    self.ajaxError = function(response) {
      self.clusterModel.update();
      $.publish('showError', [I18n.t('ui.sorryAnError') + ' ' +  I18n.t('ui.tryAgain')]);
      return false;
    };

    // Selects all versions for the currently selected product.
    // Called when the product changes in order to select all versions
    // for the new product
    self.updateSelectedVersions = function() {
      if (self.selectedProduct()) {
        var oldVersions = self.filters.versions();
        var newVersions = _.pluck(self.selectedProduct().versions, 'version');
        var intersection = _.intersection(oldVersions, newVersions);
        if (intersection.length > 0) {
          // Some of the versions still apply so the product hasn't changed. Update
          // the selected versions to the intersection of the two lists
          self.filters.versions(intersection);
        } else {
          // No overlap in version most likely means user changed the product
          // or changed the cluster and the new cluster has completely different 
          // set of versions for this product. So reset the versions to 'all'
          self.filters.versions(newVersions);
        }
      }
    };

    self.updateSelectedHost = function(host) {
      self.selectedHost(host);
    };

    self.clearSelectedHost = function(host) {
      self.selectedHost(null);
    };

    self.clusterChanged = function() {
      self.loadData();
      self.updateUrlFromFilters();
    };

    self.productChanged = function() {
      self.updateSelectedVersions();
      self.updateUrlFromFilters();
    };

    self.versionsChanged = function() {
      self.updateUrlFromFilters();
      return true;
    };

    self.updateUrlFromFilters = function() {
      UrlParams.set({
        clusterId: self.filters.clusterId(),
        productName: self.filters.productName(),
        versions: self.filters.versions().join(',')
      });
    };

    self.updateFiltersFromUrlParams = function() {
      self.filters.productName(UrlParams.params.productName);
      var versions = UrlParams.params.versions ? UrlParams.params.versions.split(',') : [];
      self.filters.versions(versions);
      self.filters.clusterId(UrlParams.params.clusterId);
    };

    // Hides any popup that may be visible before loading data for a new cluster
    self.hidePopovers = function() {
      $('.hosts > li').each(function() {
        if ($(this).data('popover')) {
          $(this).popover('hide');
        }
      });
    };

    // Host popovers are created only when needed. This method sets up listeners
    // for all host elements and creates a popover if one doesn't exist for
    // that host.
    // It also sets up a page level listener that hides popovers if the user
    // clicks somewhere else on the page.
    self.registerForPopoverEvents = function() {
      $('.hosts > li').each(function() {
        $(this).click(function() {
          if (!$(this).data('popover')) {
            $(this).popover({
              placement: self.getPopoverPlacement,
              trigger: 'manual',
              content: function() {
                var content = $hostPopoverContainer.clone();
                ko.cleanNode(content[0]);
                return content.show();
              }
            });
          }
          $(this).popover('show');
        });
      });

      // Listen to click events on the page and hide any popover that is left open
      $('html').on('click', function(e) {
        $('.hosts > li').each(function() {
          // Check if the target is a host element or a popover object (or children of these)
          // If we haven't created a popover for this host yet, don't bother trying
          // to hide it
          if ($(this).data('popover') &&
              !$(this).is(e.target) &&
              $(this).has(e.target).length === 0 &&
              $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
          }
        });
      });
    };

    // Returns placement value for the popover (e.g., 'left', 'top', etc.)
    // Given the element it belongs to and the viewport dimensions, this method
    // tries to find the best placement for the popover.
    self.getPopoverPlacement = function(popover, element) {
      // TODO: This should be auto calculated
      var maxPopupDimension = 500;
      var placement = 'right';
      var offset = $(element).offset();

      // Preference order: bottom, left, right
      if (window.innerHeight - offset.top > maxPopupDimension) {
        placement = 'bottom';
      } else if (window.innerWidth - offset.left < maxPopupDimension) {
        placement = 'left';
      }
      return placement;
    };

    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    self.setup = function() {
      // Don't setup anything if there are no clusters
      if (!self.hasClusters()) {
        return;
      }
      // Listen to url change events
      var handle1 = jQuery.subscribe('urlHashChanged',
        _.bind(self.updateFiltersFromUrlParams, self));

      self.subscriptionHandles.push(handle1);

      // Setup filters and bindings
      var clusterId = UrlParams.params.clusterId || self.clusters[0].id;
      var productName = UrlParams.params.productName;
      var versions = UrlParams.params.versions ? UrlParams.params.versions.split(',') : [];

      self.filters = {
        clusterId: ko.observable(clusterId),
        productName: ko.observable(productName),
        versions: ko.observableArray(versions)
      };
      self.clusterModel = new ClusterModel();

      self.selectedCluster = ko.computed(function() {
        return _.find(self.clusters, function(cluster) {
          return cluster.id === self.filters.clusterId();
        });
      });

      self.selectedProduct = ko.computed(function() {
        return _.find(self.clusterModel.products(), function(product) {
          return product.name === self.filters.productName();
        });
      });

      self.hostsHeaderLabel = ko.computed(function() {
        if (!self.selectedProduct()) {
          return null;
        } else if (self.selectedProduct().synthetic) {
          return I18n.t('ui.parcel.genericHostsHeaderLabel');
        } else {
          return I18n.t('ui.parcel.hostsHeaderLabel', self.selectedProduct().name);
        }
      });

      self.disabledHostLegendMessage = ko.computed(function() {
        if (!self.selectedProduct()) {
          return null;
        } else if (self.selectedProduct().synthetic) {
          return I18n.t('ui.parcel.genericDisabledHostLegendMessage');
        } else {
          return I18n.t('ui.parcel.disabledHostLegendMessage', self.selectedProduct().name);
        }
      });

      self.loadData();
      self.start();
    };


    self.refreshData = function() {
      if (!self.isInteracting()) {
        self.loadData();
      }
    };

    /**
     * Starts the poll loop that gets the data from the server.
     */
    self.start = function() {
      if (!Util.getTestMode()) {
        self._intervalId = window.setInterval(_.bind(self.refreshData, self), 15000);
      }
    };

    /**
     * Stops the poll loop.
     */
    self.stop = function() {
      if (!Util.getTestMode()) {
        if (self._intervalId) {
          window.clearInterval(self._intervalId);
          self._intervalId = undefined;
        }
      }
    };

    /**
     * @return true when user is interacting with the dropdown.
     */
    self.isInteracting = function() {
      return $(".popover.in").length > 0;
    };


    self.setup();
  };
});

