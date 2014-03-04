// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/hosts/TemplateSelectionStep",
  "cloudera/cmf/wizard/hosts/RepositorySelectionStep",
  "cloudera/cmf/wizard/hosts/HostCredentialsStep",
  "cloudera/cmf/wizard/hosts/InstallStep",
  "cloudera/cmf/wizard/hosts/HostInspectorStep",
  "cloudera/cmf/wizard/hosts/JoinClusterStep",
  "cloudera/cmf/wizard/express/ParcelInstallStep",
  "cloudera/cmf/wizard/CommandDetailsStep",
  "cloudera/cmf/wizard/WizardBase",
  "knockout",
  "underscore"
], function (TemplateSelectionStep, RepositorySelectionStep,
  HostCredentialsStep, InstallStep, HostInspectorStep, JoinClusterStep, ParcelInstallStep,
  CommandDetailsStep, WizardBase, ko, _) {
  "use strict";

  /**
   * options = {
   *   container:            (required) "parameter required for WizardBase",
   *   hostInspectorJsonUrl: (required) "URL to get the JSON structure that describes the running of a hostInspector",
   *   templatesUrl:         (required) "URL to get the JSON structure that describes the host templates",
   *   joinClusterUrl:       (required) "URL to join the new hosts into an existing cluster",
   *   leaveClusterUrl:      (required) "URL to remove the new hosts from the existing cluster",
   *   parcelUpdateUrl:      (required) "URL to get the JSON structure that describes the latest parcel status",
   *   parcelInstallUrl:     (required) "URL to install parcel",
   *   exitUrl:              (required) "parameter required for WizardBase"
   *   clusterId:            (required) the id of the cluster,
   *   cdhVersion:           (required) the version of the CDH for this cluster,
   *   usingParcels:         (required) true if the cluster is already using the parcel.
   *   existingHosts:        (optional) ["hostNames"],
   *   newHosts:             (optional) ["hostNames"]
   * }
   */
  return function AddHostsWizard(options) {
    var steps = [];
    var dataModel = {};

    // each id must match the id of the parent container.
    // We are passing the id here because
    // it is also used in the URL hash.

    var hasNewHosts = !_.isEmpty(options.newHosts);
    
    if (hasNewHosts) {
      var repositoryStep = new RepositorySelectionStep({
        id: "repositorySelectionStep",
        // We already know which cluster
        // so we already know the format
        // from usingParcels
        enableFormatSelection: false,
        // Adding Hosts to an existing Cluster,
        // requires no knowledge of Parcel.
        enableParcelSelection: false,
        // We already know which cluster
        // so we also know the CDH version.
        enableCDHVersionSelection: false,
        // We already know which cluster
        // but we still have to let user pick the specific release.
        enablePackageSelection: !options.usingParcels,
        // If there are new hosts, user
        // will want to install CM.
        enableCM: true,
        installMethod: options.usingParcels ? "useParcel" : "usePackage"
      });
      repositoryStep.cdhVersion(options.cdhVersion);
      repositoryStep.cdhRelease("LATEST_" + options.cdhVersion);
      steps.push(repositoryStep);

      steps.push(new HostCredentialsStep({
        id: "hostCredentialsStep"
      }));

      steps.push(new InstallStep({
        id: "installStep"
      }));
    }

    var joinClusterStep = new JoinClusterStep({
      id: "joinClusterStep",
      joinUrl: options.joinClusterUrl,
      leaveUrl: options.leaveClusterUrl,
      hosts: function() {
        if (_.isEmpty(options.existingHosts)) {
          return options.newHosts || [];
        } else {
          return options.existingHosts || [];
        }
      },
      clusterId: options.clusterId
    });
    steps.push(joinClusterStep);

    steps.push(new ParcelInstallStep({
      id: "parcelInstallStep",
      updateUrl: options.parcelUpdateUrl,
      installUrl: options.parcelInstallUrl,
      parcels: function() {
        return [];
      },
      cluster: function() {
        return {
          id: options.clusterId
        };
      },
      shouldSkip: function() {
        return !options.usingParcels;
      },
      displayPageWhenActivated: false
    }));

    steps.push(new HostInspectorStep({
      id: "hostInspectorStep",
      url: options.hostInspectorJsonUrl
    }));

    var templateSelectionStep = new TemplateSelectionStep({
      id: "templateSelectionStep",
        clusterId: options.clusterId,
        listUrl: options.templatesUrl,
        getHostIds: function() {
          return joinClusterStep.getHostIds();
        }
    });
    steps.push(templateSelectionStep);

    steps.push(new CommandDetailsStep({
      id: "applyHostTemplateStep",
      getCommandId: function() {
        return templateSelectionStep.getCommandId();
      },
      shouldSkip: function() {
        return _.isEmpty(templateSelectionStep.selectedTemplate()) ||
      !templateSelectionStep.startRoles();
      }
    }));

    this.wizard = new WizardBase({
      container: options.container,
      exitUrl: options.exitUrl,
      steps: steps
    });
  };
  });
