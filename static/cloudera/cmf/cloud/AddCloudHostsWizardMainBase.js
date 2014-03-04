// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/include/RepositoryValidator", 
  "cloudera/cmf/include/CDHSelectionPage",
  "cloudera/common/I18n",
  "knockout",
  'cloudera/Util'
], function(RepositoryValidator, CDHSelectionPage, I18n, ko, Util) {
  /**
   * This module uses KnockoutJS to bind the state of the DOM to the
   * state of the view model. Either the first step is selected (the cloud credentials page
   * will be displayed), or the second step is selected (the node specifications page
   * will be displayed).
   *
   * options = {
   *   messages: {...},
   *   amisMap:
   *   maxNodes:
   *   prevPage,
   *   autodetectedRegion:
   *   devMode:
   *   testCredentialsUrl:
   *   container: "the DOM selector of the containing element"
   * }
   */
  return function(options) {
    var self = this;
    $(options.container).validate({
      rules: {
        cdhCustomUrl: "repository",
        impalaCustomUrl: "repository",
        solrCustomUrl: "repository",
        cmCustomUrl: "repository"
      }
    });

    /**
     * Initialize the knockout state. Note: we may
     * be entering the page via the back button.
     * In which case, we want to initialize the state
     * based on the DOM value.
     */
    function initParams() {
      self.chosenStep = ko.observable(-1);

      self.enableCDHVersionSelection = ko.observable(true);

      // Image ID is custom
      var isCustomImage = $("input[name=isCustomImage]:checked").val() || "false";
      self.isCustomImage = ko.observable(isCustomImage);
      
      // Private key is supplied by the user
      var isSuppliedKey = $("input[name=isSuppliedKey]:checked").val() || "false";
      self.isSuppliedKey = ko.observable(isSuppliedKey);
      
      var imageId = $("input[name=imageId][type=text]").val() || "";
      self.imageId = ko.observable(imageId);

      var username = $("input[name=username][type=text]").val() || "";
      self.username = ko.observable(username);
      
      var passphrase = $("input[name=passphrase]").val() || "";
      self.passphrase = ko.observable(passphrase);

      var numInstances = $("input[name=numInstances]").val() || "";
      self.numInstances = ko.observable(numInstances);
      
      var customGroup = $("input[name=customGroup]").val() || "";
      self.customGroup = ko.observable(customGroup);

      self.testCredentialsStatus = ko.observable("");
      self.testCredentialsText = ko.observable("");

      self.credentialsValid = false;
      // Used for credential validation when the user click next,
      // but the credentials have not been validated.
      self.goForwardAfterValidation = false;

      function osCheck(newOs) {
        if (newOs === "ubuntu") {
          // CDH3 doesn't work on Ubuntu 12.04 or later, so if
          // the user selects Ubuntu 12.04 or later, remove
          // the option of CDH3 from the CDH selection page.
          $(".cdh3Radio").addClass("hidden");
        } else {
          // The user selected something other than Ubuntu 12.04 or
          // later, so make sure that CDH3 is shown in the CDH selection
          // page.
          $(".cdh3Radio").removeClass("hidden");
        }
      }

      // No need to show any errors initially.
      self.numInstancesError = ko.observable("");
      self.customGroupError = ko.observable("");
      self.imageIdUsernameError = ko.observable("");
      self.identityError = ko.observable("");
      self.credentialError = ko.observable("");
      self.privateKeyError = ko.observable("");

      // Region may be autodetected.
      if (options.autodetectedRegion === "") {
        self.selectedRegion = ko.observable($("select[name='region'] option:selected")
          .val() || "");
      } else {
        self.selectedRegion = ko.observable(options.autodetectedRegion);
      }
      self.selectedOs = ko.observable($("select[name='os'] option:selected")
        .val() || "");
      self.selectedOs.subscribe(osCheck);
      osCheck(self.selectedOs());
      self.underlyingImageId = ko.computed(function() {
        return options.amisMap[self.selectedOs()][self.selectedRegion()];
      }, self);
      
      
      // Observables for the CDH selection page and knockout helper methods
      // are initialized in this call.
      CDHSelectionPage.initializeKnockout(self);
      
      // Enable the submit button by default.
      self.submitted = ko.observable(false);
    }

    initParams();  

    // Initialize popovers and tooltips in the wizard.
    $("[rel='popover']").popover();
    
    $("[rel='popover']").click(function(event) {
      $(event.target).popover('toggle');
      $("body").on("mousedown.popoverclose", function(closeEvent) {
        if ($(".popover").length > 0) {
          if ((closeEvent.target !== event.target)
              && (!($.contains($(".popover").get(0), closeEvent.target))
                  || $(closeEvent.target).hasClass("popover-close"))) {
            $("[rel='popover']").popover('hide');
          }
        }
        // Unregister close event.
        if ($(".popover").length === 0) {
          $("body").off("mousedown.popoverclose");
        }
      });
    });
    
    $("[rel='tooltip']").tooltip();
    
    /**
     * Allow one click on the start installation button.
     */
    self.enableStartInstall = ko.dependentObservable(function () {
      return !self.submitted();
    }, self);

    function focusAndSelect($el, showError){
      if (showError) {
        $el.closest(".control-group").addClass("error");
      }
      $el.focus();
      $el.select();
    }

    function resetErrors () {
      $(".control-group").removeClass("error");
      $("#numInstancesDiv").removeClass("error");
      $("#customGroupDiv").removeClass("error");
      self.identityError("");
      self.credentialError("");
      self.imageIdUsernameError("");
      self.privateKeyError("");
      self.numInstancesError("");
      self.customGroupError("");
    }

    // Reason we don't use knockout to obtain the identity or credential is 
    // that knockout has a bug whereby it doesn't update an observable 
    // when its corresponding DOM element is filled out by the 
    // browser (e.g. due to username/password autocompletion, which is 
    // what occurs here).
    
    function checkEmptyIdentity () {
      if ($("input[name=identity]").val() === '') {
        self.identityError(options.messages.missingIdentity);
        focusAndSelect($("input[name=identity]"), true);
        return false;
      }
      return true;
    }
    
    function checkEmptyCredential () {
      if ($("input[name=credential]").val() === '') {
        self.credentialError(options.messages.missingCredential);
        focusAndSelect($("input[name=credential]"), true);
        return false;
      }
      return true;
    }

    function checkEmptyPrivateKey () {
      if (self.isSuppliedKey() === 'true' && $("[name=privateKey]").val() === '') {
        self.privateKeyError(options.messages.missingPrivateKey);
        focusAndSelect($("input[name=privateKey]"), true);
        return false;
      } else {
        return true;
      }
    }

    function checkInvalidNumInstances () {
      var intRegex = /^\d+$/; // to test if the input is an integer
      var parsedNum = parseFloat(self.numInstances());
      if (isNaN(parsedNum) || !intRegex.test(parsedNum) || parsedNum > 
        options.maxNodes || parsedNum <= 0) {
        self.numInstancesError(options.messages.invalidNumInstances);
        $("#numInstancesDiv").addClass("error")
        .find("input[name=numInstances]")
          .focus()
          .select();
        return false;
      }
      
      return true;
    }
    
    // For testing purposes -- so that we can call checkInvalidNumInstances() 
    // from outside this file.
    self.checkInvalidNumInstances = checkInvalidNumInstances;
    
    function checkInvalidCustomGroup () {
      // Starts with a lower-case letter or number. Can contain only 
      // lower-case  letters, numbers, underscores, spaces, or dashes. 
      // Is between 3 to 63 characters in length, inclusive.
      var sgRegex = /^[a-z0-9][a-z0-9_ \-$]{2,62}$/;
      // Since this is an optional parameter, it can be blank.
      if (self.customGroup() !== '' && 
          !sgRegex.test(self.customGroup())) {
        self.customGroupError(options.messages.invalidCustomGroup);
        $("#customGroupDiv").addClass("error")
        .find("input[name=customGroup]")
          .focus()
          .select();
        return false;
      }
      
      return true;
    }
    
    // For testing purposes -- so that we can call checkInvalidCustomGroup() 
    // from outside this file.
    self.checkInvalidCustomGroup = checkInvalidCustomGroup;
    
    function checkEmptyUsername () {
      if (self.isCustomImage() === 'true' && self.username() === '') {
        self.imageIdUsernameError(options.messages.missingUsernameOrImageId);
        focusAndSelect($("input[name=username]"), true);
        return false;
      } else {
        return true;
      }
    }
    
    function checkEmptyImageId () {
      if (self.isCustomImage() === 'true' && self.imageId() === '') {
        self.imageIdUsernameError(options.messages.missingUsernameOrImageId);
        focusAndSelect($("input[name=imageId]"), true);
        return false;
      } else {
        return true;
      }
    }

    self.checkFormValid = function () {
      return $("#mainForm").valid();
    };
    
    self.checkReposPage = function (vm, event) {
      return self.checkFormValid();
    };  

    /**
     * Move to the next view by altering the URL hash.
     */
    self.continueClicked = function (vm, event) {
      // Hide popovers.
      $('a[rel="popover"]').popover('hide');
      if (location.hash === ""){
        location.hash = "specs";
      } else if (location.hash === "#specs" && self.checkSpecsPage(vm, event)){
        location.hash = "creds";
      } else if (location.hash === "#creds" && self.checkCredsPage(vm, event)) {
        // Skip repo selection. Custom repos allowed only in dev mode. 
        if (options.devMode === 'true') {
          location.hash = "repos";
        } else {
          location.hash = "review";
        }
      } else if (location.hash === "#repos" && self.checkReposPage(vm, event)) {
        location.hash = "review";
      }
      event.preventDefault();
    };

    self.startInstallClicked = function (vm, event) {
      self.checkReposPage(vm, event);
    };

    self.backClicked = function (vm, event) {
      history.go(-1);
    };

    self.checkCredsPage = function (vm, event) {
      resetErrors();
      // Validate credentials if needed.
      if (!self.credentialsValid) {
        self.goForwardAfterValidation = true;
        self.testCredentials();
        return false;
      }
      if (!self.checkFormValid()) {
        return false;
      }
      
      var result = checkEmptyIdentity();
      result = checkEmptyCredential() && result;
      result = checkEmptyPrivateKey() && result;
      return result;
    };
    
    self.checkSpecsPage = function (vm, event) {
      resetErrors();
      if (!self.checkFormValid()) {
        return false;
      }
      
      var result = checkInvalidNumInstances();
      result = checkInvalidCustomGroup() && result;
      result = checkEmptyImageId() && result;
      result = checkEmptyUsername() && result;
      return result;
    };

    function findRadioCaption(name, value) {
      var input = $("input[name='" + name + "'][value='" + value + "']");
      if (input) {
        return $(input[0].nextSibling).text();
      }
      return " ";
    }

    self.setupReview = function() {
      // Machine type.
      $("#reviewInstanceType").text($("select[name='hardwareId']").find(":selected").text());

      // OS.
      if (self.isCustomImage() === 'false') {
        $("#reviewOs").text($("select[name='os']").find(":selected").text());
      }

      // CM Agent, CDH, Impala and Solr.
      $("#reviewCDHRelease").text(findRadioCaption('cdhRelease', self.cdhRelease()));
      $("#reviewCMAgent").text(findRadioCaption('cmRelease', self.cmRelease()));
      $("#reviewImpala").text(findRadioCaption('impalaRelease', self.impalaRelease()));
      $("#reviewSolr").text(findRadioCaption('solrRelease', self.solrRelease()));
    };

    /**
     * When the Start Installation button is clicked.
     */
    $('#mainForm').submit(function (event) {
      if (self.chosenStep() < 4) {
        self.continueClicked(self, event);
      } else {
        self.startInstallClicked(self, event);
      }
    });

    self.updatePageTitle = function (title) {
      setTimeout(function() {
        $.publish("updatePageTitle", [title]);
      }, 200);
    };
    
    self.goToStart = function () {
      location.hash = "";
    };
    
    self.goBack = function () {
      // 0 is the welcome page, and the Back button should be disabled.
      if (self.chosenStep() > 0) {
        history.go(-1);
      }
    };

    // Reason that we need these regexes as opposed to a simple "#creds" 
    // and "#repos" match is because when you try to go back from 
    // "#creds" (pg. 2) to "" (instance specifications, pg. 1), nothing happens, 
    // since we have no explicit handler for "" (and if we included one, 
    // the quit button would be messed up, since "/cmf/hardware/hosts"
    // [the destination of the quit button], which has no hash, would match 
    // against "").
    $.sammy(function () {
      this.get(/specs\?provider=[A-Za-z0-9_\-]+#review/, function () {
        // regex matches "specs?provider=<whatever>#review"
        if (self.initialized) {
          self.setupReview();
          self.chosenStep(4);
          self.updatePageTitle($("#reviewTitle").text());
        } else { // page was refreshed, so we lost the content of previous pages
          self.goToStart();
        }
      });

      this.get(/specs\?provider=[A-Za-z0-9_\-]+#repos/, function () {
        // regex matches "specs?provider=<whatever>#repos"
        if (self.initialized) {
          self.chosenStep(3);
          self.updatePageTitle($("#reposTitle").text());
        } else { // page was refreshed, so we lost the content of previous pages
          self.goToStart();
        }
      });
      
      this.get(/specs\?provider=[A-Za-z0-9_\-]+#creds/, function () {
        // regex matches "specs?provider=<whatever>#creds"
        if (self.initialized) {
          self.chosenStep(2);
          self.updatePageTitle($("#credsTitle").text());
        } else { // page was refreshed, so we lost the content of previous pages
          self.goToStart();
        }
      });
      
      this.get(/specs\?provider=[A-Za-z0-9_\-]+#specs/, function () {
        // regex matches "specs?provider=<whatever>#review"
        // This is the first page with user content, and we land here after instance termination.
        self.chosenStep(1);
        self.updatePageTitle($("#specsTitle").text());
      });

      // The reason that we don't include the '?' and subsequent 
      // characters in this regex is that if there is no content 
      // after the first '#' in a URL (or if there is no '#' at all), 
      // sammy will just strip away everything 
      // after the first '?' it encouters (assuming that the first '?' comes
      // before the first '#'). So "specs?provider=<whatever>" 
      // (no hash at all) or "specs?provider<whatever>#" (nothing after 
      // the hash) both become just "specs." But 
      // something like "specs?provider=<whatever>#<hash-content>" is 
      // not altered.
      this.get(/specs/, function () {
        self.chosenStep(0);
        self.updatePageTitle($("#welcomeTitle").text());
      });
    }).run();

    self.testCredentials = function() {

      self.testCredentialsText(options.messages.testCredentialsProgress);
      self.testCredentialsStatus("progress");

      var ajaxError = function(response) {
        self.testCredentialsStatus("error");
        self.testCredentialsText(I18n.t("ui.sorryAnError"));
        return false;
      };

      var callback = function(response) {
        if (response.message === "OK") {
          self.testCredentialsStatus(response.data.status);
          self.testCredentialsText(response.data.text);
          self.credentialsValid = (response.data.status === 'success');
          if (self.credentialsValid && self.goForwardAfterValidation) {
            self.goForwardAfterValidation = false;
            self.continueClicked();
          }
        } else {
          $.publish("showError", [response.message]);
          self.testCredentialsStatus("error");
          self.testCredentialsText(I18n.t("ui.sorryAnError"));
        }
        self.goForwardAfterValidation = false;
      };

      $.ajax({
        type: 'POST',
        url: options.testCredentialsUrl,
        data: {
          accessId: $("input[name=identity]").val(),
          secretKey: $("input[name=credential]").val()
        },
        success: callback,
        error: ajaxError,
        dataType: 'json'
      });
    };

    function credentialsChanged() {
      self.testCredentialsStatus("");
      self.testCredentialsText("");
      self.credentialsValid = false;
    }

    $("input[name=identity]").keypress(function() { credentialsChanged(); });
    $("input[name=credential]").keypress(function() { credentialsChanged(); });

    // Hide warning if TLS is being used.
    function updateTLSWarning() {
        if (Util.isHttpsUrl(window.location.href)) {
            $("#tlsWarning").hide();
        }
    }
    updateTLSWarning();

    self.applyBindings = function() {
      ko.applyBindings(self, $(options.container)[0]);
    };
    self.initialized = true;
  };
});
