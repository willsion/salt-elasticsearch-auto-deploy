// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define([
  "cloudera/Util",
  "cloudera/common/I18n",
  "cloudera/common/Url",
  "underscore",
  "knockout",
  "komapping",
  "cloudera/cmf/CmfPath"
], function (Util, I18n, Url, _, ko, komapping, CmfPath) {

  function generateHtmlList(list) {
    var html = _.map(list, function(item){
      // Need a container because $.html returns
      // the innerHtml.
      var $container = $("<ul>");
      var $li = $("<li>").text(item);
      $container.append($li);
      return $container.html();
    });
    return "<ul>" + html.join("") + "</ul>";
  }

  /**
   * data is the plain JSON structure.
   * parent is the outer knockout structure.
   * $ajaxPopupLink is the DOM element of a link that
   * opens a popup via ajax.
   */
  var State = function(data, parent, $ajaxPopupLink) {
    var self = this;
    komapping.fromJS(data, {}, self);
    self.product = parent.product;
    self.version = parent.version;
    self.clusterId = parent.clusterId;
    self.isUpgradeNeeded = parent.isUpgradeNeeded;
    self.releaseNotes = parent.releaseNotes;

    if (_.isUndefined(self.errors)) {
      self.errors = ko.observableArray();
    }

    if (_.isUndefined(self.warnings)) {
      self.warnings = ko.observableArray();
    }

    self.showErrors = function(vm, event) {
      $.publish("showAlert", [self.errorsHtml(), self.errorsTitle()]);
      if (event) {
        event.preventDefault();
      }
    };

    self.showWarnings = function(vm, event) {
      $.publish("showAlert", [self.warningsHtml(), self.warningsTitle()]);
      if (event) {
        event.preventDefault();
      }
    };

    self.errorsHtml = ko.computed(function() {
      return generateHtmlList(self.errors());
    });

    self.warningsHtml = ko.computed(function() {
      return generateHtmlList(self.warnings());
    });

    self.errorsTitle = ko.computed(function() {
      return "<i class='IconError16x16'></i> " + I18n.t("ui.nErrors", self.errors().length);
    });

    self.warningsTitle = ko.computed(function() {
      return "<i class='IconWarning16x16'></i> " + I18n.t("ui.nWarnings", self.warnings().length);
    });

    /**
     * Downloads a set of parcels (with the specific product/version)
     * from the remote server.
     */
    self.download = function() {
      if (self.isRemotelyAvailable()) {
        var callback = function() {
          self.stage('DOWNLOADING');
          self.progress(0);
          self.totalProgress(0);
          self.count(0);
          self.totalCount(0);
        };
        self.execute(parent.urls.downloadUrl(), callback);
      }
    };

    /**
     * Deletes the specific parcels from the local repository.
     */
    self.deleteFromLocal = function() {
      if (self.isDownloaded()) {
        var callback = function() {
          self.stage('AVAILABLE_REMOTELY');
          self.progress(0);
          self.totalProgress(0);
          self.count(0);
          self.totalCount(0);
        };
        self.execute(parent.urls.deleteUrl(), callback);
      }
    };

    /**
     * Distributes the specific parcels to all the machines
     * in this cluster.
     */
    self.distribute = function() {
      if (self.isDownloaded()) {
        var callback = function() {
          self.stage('DISTRIBUTING');
          self.progress(0);
          self.totalProgress(0);
          self.count(0);
          self.totalCount(0);
        };
        self.execute(parent.urls.distributeUrl(), callback);
      }
    };

    /**
     * Reverts the distribute process by removing the
     * specific parcels from all the machines in this cluster.
     */
    self.undistribute = function() {
      if (self.isDistributed()) {
        self.doUndistribute();
      }
    };

    /**
     * The helper funciton that is used to actually perform
     * the undistribute.
     **/
    self.doUndistribute = function() {
      var callback = function() {
        self.stage('UNDISTRIBUTING');
        self.progress(0);
        self.totalProgress(0);
        self.count(0);
        self.totalCount(0);
      };
      self.execute(parent.urls.undistributeUrl(), callback);
    };

    /**
     * Undistribute the parcel if we are currently in the
     * upgrade mode. This is needed because clicking the upgrade
     * button activates the parcel then performs the upgrade. If
     * a user cancels out of the upgrade popup we need to deactivate
     * before we can undistribute the parcel.
     **/
    self.undistributeWithUpgrade = function() {
      if (self.isClusterUpgradeRequired()) {
        if (self.stage() === "ACTIVATED") {
          self.execute(parent.urls.deactivateUrl(), function() {
            self.doUndistribute();
          });
        }else {
          self.doUndistribute();
        }
      }
    };

    /**
     * Initiates a cluster upgrade. THis involves first
     * activating the parcel, then running then launching
     * the upgrade popup.
     */
    self.upgrade = function() {
      if (self.isClusterUpgradeRequired()) {
        var url = new Url(parent.urls.upgradeUrl());
        var params = url.getParamsObject();
        params.parcelVersion = self.version();
        params.parcelProduct = self.product();
        url.setParamsObject(params);
        $ajaxPopupLink.attr('href', url.getHref());
        $ajaxPopupLink.trigger("click");
      }
    };

    /**
     * Shows the upgrade popup.
     **/
    self.showRestartPopup = function(isActivate) {
      var url = new Url(parent.urls.restartPopupUrl());
      var params = url.getParamsObject();
      params.isActivate = isActivate;
      url.setParamsObject(params);
      $ajaxPopupLink.attr('href', url.getHref());
      $ajaxPopupLink.trigger("click");
    };

    /**
     * Activates the specific product/version for this cluster.
     */
    self.activate = function() {
      if (self.isDistributed()) {
        var callback = function() {
          self.stage('ACTIVATED');
          self.progress(0);
          self.totalProgress(0);
          self.count(0);
          self.totalCount(0);
          self.showRestartPopup(true);
        };
        self.execute(parent.urls.activateUrl(), callback);
      }
    };

    /**
     * Deactivates the specific product/version for this cluster.
     * The system default packages will be used instead.
     */
    self.deactivate = function() {
      if (self.isActivated()) {
        var callback = function() {
          self.stage('DISTRIBUTED');
          self.progress(0);
          self.totalProgress(0);
          self.count(0);
          self.totalCount(0);
          self.showRestartPopup(false);
        };
        self.execute(parent.urls.deactivateUrl(), callback);
      }
    };

    self.cancel = function() {
      self.execute(parent.urls.cancelUrl());
    };

    /**
     * Executes a server call to a specific URL.
     */
    self.execute = function(url, callback) {
      var queryParams = { product: self.product(),
        version: self.version()
      };
      $.post(url, queryParams, function(response) {
        var jsonResponse = Util.filterJsonResponseError(response);
        if (jsonResponse.message !== "OK") {
          $.publish('showError', [jsonResponse.message]);
        } else if ($.isFunction(callback)) {
          callback();
        }
        // After the execution response, expedite the update.
        $.publish("refreshAllParcels");
      });
    };

    /**
     * Displays the release notes in a modal alert.
     */
    self.showReleaseNotes = function() {
      $.publish("showAlert", [self.releaseNotes(), I18n.t('ui.parcel.releaseNotes')]);
    };

    /**
     * @return true to display the progress stage.
     */
    self.showStage = ko.computed(function() {
      if (self.isActivated() || self.isDistributing() || self.isDownloading() || self.isUndistributing()) {
        return false;
      } else {
        return true;
      }
    });

    /**
     * @return true if the specific parcels are in the unavailable stage.
     */
    self.isUnavailable = ko.computed(function() {
      return self.stage() === 'UNAVAILABLE';
    });

    /**
     * @return true if the specific parcels are in the remotely available stage.
     */
    self.isRemotelyAvailable = ko.computed(function() {
      return self.stage() === 'AVAILABLE_REMOTELY';
    });

    /**
     * @return true if the specific parcels are in the downloaded stage.
     */
    self.isDownloaded = ko.computed(function() {
      return self.stage() === 'DOWNLOADED';
    });

    /**
     * @return true if the specific parcels are in the activated stage.
     */
    self.isActivated = ko.computed(function() {
      return (self.stage() === 'ACTIVATED' && !self.isClusterUpgradeRequired());
    });

    /**
     * @return true if the specific parcels are in the distributed stage.
     */
    self.isDistributed = ko.computed(function() {
      return (self.stage() === 'DISTRIBUTED' && !self.isClusterUpgradeRequired());
    });

    /**
     * @return true if the specific parcels are in the distributed stage, not active,
     * and still in use by one or more processes
     */
    self.isStillInUse = ko.computed(function() {
      return (self.isDistributed() && self.roleCount() > 0);
    });

    /**
     * @return true if the specific parcels are still getting downloaded.
     */
    self.isDownloading = ko.computed(function() {
      return self.stage() === 'DOWNLOADING';
    });

    /**
     * @return true if the specific parcels are still getting distributed/unpacked.
     */
    self.isDistributing = ko.computed(function() {
      return self.stage() === 'DISTRIBUTING';
    });

    /**
     * @return true if the specific parcels are getting removed from the agents.
     */
    self.isUndistributing = ko.computed(function() {
      return self.stage() === 'UNDISTRIBUTING';
    });

    /**
     * @return true if we need to perform a cluster upgrade.
     */
    self.isClusterUpgradeRequired = ko.computed(function() {
      var isUpgradeNeeded = false;
      // This is an optional flag. Most of the tests
      // do not have this flag set in the JSON.
      if (_.isFunction(self.isUpgradeNeeded)) {
        isUpgradeNeeded = self.isUpgradeNeeded();
      }
      return (((self.stage() === 'DISTRIBUTED') || (self.stage() === 'ACTIVATED'))
              && isUpgradeNeeded);
    });

    /**
     * @return "progress / totalProgress" as a string.
     */
    self.progressSummary = ko.computed(function() {
      if (self.progress() > 0 || self.totalProgress() > 0) {
        return self.progress() + " / " + self.totalProgress();
      } else {
        return "";
      }
    });

    /**
     * @return "count / totalCount" as a string.
     */
    self.countSummary = ko.computed(function() {
      if (self.count() > 0 || self.totalCount() > 0) {
        return self.count() + " / " + self.totalCount();
      } else {
        return "";
      }
    });

    /**
     * @return count / totalCount as a percentage string.
     */
    self.countPct = ko.computed(function() {
      if (self.totalCount() > 0) {
        var val = self.count() * 100 / self.totalCount();
        return val.toFixed(0) + "%";
      } else {
        return "0%";
      }
    });

    /**
     * @return progress / totalProgress as a percentage string.
     */
    self.progressPct = ko.computed(function() {
      if (self.totalProgress() > 0) {
        var val = self.progress() * 100 / self.totalProgress();
        return val.toFixed(0) + "%";
      } else {
        return "0%";
      }
    });

    /**
     * @return combined progress / combined total progress as a percentage string.
     */
    self.combinedProgressPct = ko.computed(function() {
      if (self.combinedTotalProgress() > 0) {
        var val = self.combinedProgress() * 100 / self.combinedTotalProgress();
        return val.toFixed(0) + "%";
      } else {
        return "0%";
      }
    });

    /**
     * @return url for the parcel usage page for the given product version
     */
    self.parcelUsageUrl = ko.computed(function() {
      return CmfPath.getParcelUsageUrl({
        clusterId: parent.clusterId,
        productName: self.product(),
        versions: self.version()
      });
    });

    /**
     * @return label for the parcel usage popup link (e.g., 10 Services, 3 Hosts, and 23 Roles)
     */
    self.parcelUsageLabel = ko.computed(function() {
      return I18n.t("ui.parcel.servicesHostsRoles", self.serviceCount(), self.hostCount(), self.roleCount());
    });
  };


  /**
   * options {
   *   container:    (required) "selector of the container DOM object",
   *   updateUri:    (required) "the uri for fetching the JSON",
   *   updateParams: (optional) "the parameters for fetching the JSON",
   *   afterUpdate:  (optional) "a callback to execute after each update"
   *   separateRemote:(optional) if true, show the remote/downloading modules in a separate section.
   *   and don't show them under the cluster. default false.
   * }
   */
  var Parcels = function(options) {
    var self = this;
    var $container = $(options.container);
    var $popoverContent = $(options.popoverContent);
    // We have a special link on the page that can be used
    // to display a popup (e.g. the Upgrade popup).
    var $ajaxPopupLink = $container.find(".ajax-popup-link");

    var mapping = {
      'state': {
        create: function(args) {
          return new State(args.data, args.parent, $ajaxPopupLink);
        }
      }
    };

    self.isLoading = ko.observable(false);
    self.activeOnly = ko.observable(false);
    self.data = ko.observableArray();
    self.dataRemote = ko.observableArray();
    self.hoveredParcel = ko.observable();

    /**
     * @return true when user is interacting with the dropdown.
     */
    self.isInteracting = function() {
      return ($container.find(".actionsMenu.open").length + $(".popover.in").length) > 0;
    };

    /**
     * Group by active/non active state.
     */
    self.groupByProduct = function(data, predicateFunc) {
      var result = [];
      _.each(data, function(d) {
        // Group the states by product/version.
        var statesByProduct = _.groupBy(d.states, function(s) {
          return s.product;
        });

        var statesByProductArr = [];
        _.each(statesByProduct, function(states, product) {
          _.each(states, function(pvState) {
            // This is some what hacky that the State object,
            // needs to know about the urls that performs the various actions.
            // But the mapping create method only exposes the arguments:
            // options.data and options.parent.
            //
            // This adds the urls property to the pvState object, which is the parent object
            // of a State object.
            pvState.urls = d.cluster.urls;
            pvState.clusterId = d.cluster.id;
          });
          var filteredStates = _.chain(states).sortBy(function(s) {
            return s.version;
          }).filter(function(s) {
            if (_.isFunction(predicateFunc)) {
              return predicateFunc(s);
            } else {
              return true;
            }
          }).reverse().value();

          if (filteredStates.length > 0) {
            statesByProductArr.push(filteredStates);
          }
        });

        // result looks like
        // [ {
        //   cluster: {
        //     name: "...",
        //   },
        //   statesByProduct: [
        //     [ {
        //       urls: ...
        //       product: 'CDH',
        //       version: '1.0',
        //       state: {
        //             stage: "AVAILABLE_REMOTELY",
        //             count: ...'
        //       }
        //     }, {
        //       // another version
        //     }], [
        //       // another product
        //     ]
        // }, {
        //   // another cluster
        // } ]
        // We cannot combine product, version and members of the state into a single object
        // because knockout mapping requires a name when overriding the constructor.
        result.push({
          cluster: d.cluster,
          message: d.message,
          statesByProduct: statesByProductArr
        });
      });
      return _.sortBy(result, function(entry) {
        return entry.cluster.name;
      });
    };

    /**
     * data currently contains all the parcel information by cluster.
     * However, anything that are is cluster specific should not be there.
     * This function separates those cluster specific information from
     * the remote ones.
     */
    self.separateRemote = function(data) {

      // Question: where should those UNAVAILABLE parcels appear?
      var remoteOnly = function(s) {
        var stage = s.state.stage;
        return stage === "AVAILABLE_REMOTELY" || stage === "DOWNLOADING" || stage === "UNAVAILABLE";
      };
      var clusterOnly = function(s) {
        var stage = s.state.stage;
        return stage !== "AVAILABLE_REMOTELY" && stage !== "DOWNLOADING" && stage !== "UNAVAILABLE";
      };

      var dataRemote, dataByCluster;
      if (options.separateRemote) {
        dataByCluster = self.groupByProduct(data, clusterOnly);
        var dataByClusterRemote = self.groupByProduct(data, remoteOnly);
        if (dataByClusterRemote.length > 0) {
          // All of them should be the same.
          // Just pick the first set.
          dataRemote = [dataByClusterRemote[0]];
        } else {
          // Cluster information is not important here.
          dataRemote = [{
            cluster: {},
            message: "",
            statesByProduct: []
          }];
        }
      } else {
        dataRemote = [];
        dataByCluster = self.groupByProduct(data);
      }
      return {
        dataRemote: dataRemote,
        dataByCluster: dataByCluster
      };
    };

    /**
     * Updates the status.
     */
    self.update = function() {
      self.isLoading(true);
      $.post(options.updateUri, options.updateParams || {}, function(data) {
        if (!self.isInteracting()) {
          var dataRemoteAndByCluster = self.separateRemote(data);
          komapping.fromJS({
            isLoading: false,
            activeOnly: self.activeOnly(),
            dataRemote: dataRemoteAndByCluster.dataRemote,
            data: dataRemoteAndByCluster.dataByCluster
          }, mapping, self);

          if (_.isFunction(options.afterUpdate)) {
            options.afterUpdate();
          }
          self.registerForPopoverEvents();
        } else {
          // Do not update the view model
          // because user is interacting with the UI.
          self.isLoading(false);
        }
      }, "json");
    };


    /**
     * Registers for hover events to show and dismiss popovers.
     * Popovers are shown on hover and hidden when the user clicks away.
     * 
     * The popover content has a clickable link so we need to allow the
     * user the interact with it but at the same time we want the link 
     * that triggers the popover to take the user to the Parcel Usage page. 
     */
    self.registerForPopoverEvents = function() {
      // Setup the still-in-use popovers after updating the page content
      $('.popover-trigger').each(function() {
        $(this).mouseenter(function() {
          var activeTrigger = this;
          if (!$(this).data('popover')) {
            $(this).popover({
              title: I18n.t("ui.parcel.olderParcelHeader"),
              trigger: 'manual',
              delay: 500,
              content: function() {
                var content = $popoverContent.clone();
                ko.cleanNode(content[0]);
                return content.show();
              }
            });
          }
          // Hide other popups
          $('.popover-trigger').each(function() {
            if (this !== activeTrigger && $(this).data('popover')) {
              $(this).popover('hide');
            }
          });
          // Show this one unless it is already visible or no parcel became the 
          // hovered yet (Technically possible if your mouse happens to be
          // at the top of the link when the page loads.)
          if (self.hoveredParcel() && !$(this).data('popover').tip().hasClass('in')) {
            $(this).popover('show');
          }
        });
      });
    };

    /**
     * Starts the poll loop that gets the data from the server.
     */
    self.start = function() {
      self.update();
      if (!Util.getTestMode()) {
        self._intervalId = window.setInterval(_.bind(self.update, self), 5000);
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

    var handle1 = $.subscribe("refreshAllParcels", function() {
      self.update();
    });

    self.subscriptionHandles = [handle1];
    self.unsubscribe = function() {
      Util.unsubscribe(self);
    };

    // Listen to click events on the page and hide any popover that is not the 
    // target of the click
    $('html').on('click', function(e) {
      $('.popover-trigger').each(function() {
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


    /**
     * Applies binding with the DOM element. Can only be done once.
     */
    self.applyBindings = function() {
      ko.applyBindings(self, $container[0]);
    };
  };

  return Parcels;
});
