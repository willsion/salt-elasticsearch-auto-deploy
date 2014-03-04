// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/hosts/RepositorySelectionStep",
  "cloudera/cmf/wizard/hosts/HostCredentialsStep",
  "cloudera/cmf/wizard/hosts/InstallStep",
  "cloudera/cmf/wizard/hosts/HostInspectorStep",
  "cloudera/cmf/wizard/WizardBase",
  "knockout",
  "underscore"
], function (RepositorySelectionStep, HostCredentialsStep, InstallStep, HostInspectorStep, WizardBase, ko, _) {
  "use strict";

  /**
   * options = {
   *   hostInspectorJsonUrl: "URL to get the JSON structure that describes the running of a hostInspector"
   *   container:            "parameter required for WizardBase",
   *   exitUrl:              "parameter required for WizardBase"
   * }
   */
  return function UpgradeHostsWizard(options) {
    var steps = [];
    var dataModel = {};

    // each id must match the id of the parent container.
    // We are passing the id here because
    // it is also used in the URL hash.

    steps.push(new RepositorySelectionStep({
      id: "repositorySelectionStep",
      // Do not let user choose Parcel/Package
      // because we are upgrading CM only.
      enableFormatSelection: false,
      // Do not show the Parcel Repo selection.
      enableParcelSelection: false,
      // Do not allow user to choose between
      // CDH3 and CDH4.
      enableCDHVersionSelection: false,
      // Do not show the Package Repo selection.
      enablePackageSelection: false,
      // Do show the CM Repo selection.
      enableCM: true
    }));

    steps.push(new HostCredentialsStep({
      id: "hostCredentialsStep"
    }));

    steps.push(new InstallStep({
      id: "installStep"
    }));

    steps.push(new HostInspectorStep({
      id: "hostInspectorStep",
      url: options.hostInspectorJsonUrl
    }));

    this.wizard = new WizardBase({
      container: options.container,
      exitUrl: options.exitUrl,
      steps: steps
    });
  };
});
