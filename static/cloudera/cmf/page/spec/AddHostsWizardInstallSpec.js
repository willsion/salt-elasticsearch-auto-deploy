// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/cmf/page/AddHostsWizardInstall',
  'underscore'
], function(AddHostsWizardInstall, _) {
  
  describe("AddHostsWizardInstall Test", function() {
    
    var module;
    
    var createModule = function (configuratorCount) {

      module = new AddHostsWizardInstall({
        detailsDialogSelector: "dontcare",
        configuratorCount: configuratorCount,
        installProgressDataURL: "dontcare",
        installDetailsURL: "dontcare",
        retryURL: "dontcare",
        rollbackURL: "dontcare",
        abortURL: "dontcare",
        errorOccurred: "dontcare",
        isCloud: false,
        cloudTerminateUrl: "dontcare",
        exitUrl: "dontcare",
        inspectorUrl: "dontcare",
        continueWithFailuresCloud: "dontcare",
        requestId: "dontcare"
        });

    };

    beforeEach(function() {
      jasmine.Ajax.useMock();
      clearAjaxRequests();

      $('<div id="nodeConfigurator">'
          + '<button id="retryAllButton"></button>'
          + '<button id="rollbackAllButton"></button>'
          + '<button id="rollbackAndRetryAllButton"></button>'
          + '<button id="abortButton"></button>'
          + '<button id="continueButton"></button>'
          + '<form id="abortForm"></form>'
          + '<div id="backQuitButtons"></div>'
          + '<div class="failedSummary"></div>'
          + '<div class="failedWaitingSummary"></div>'
          + '</div>').appendTo("body");      
    });
    
    afterEach(function() {
      $("#nodeConfigurator").remove();
    });
    
    it("should show and hide the failedWaitingSummary div after rollback all", function() {
      createModule(1);
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
            "failedState" : "",
                "isErrorState" : true,
                "isWaitingForRollback" : true,
                "state" : "PACKAGE_INSTALL",
                "stateNum" : 4,
                "totalStates" : 5
              }
        }
      });
      expect($(".failedWaitingSummary").is(":visible")).toBeTruthy();
      $("#rollbackAllButton").trigger("click");
      expect($(".failedWaitingSummary").hasClass("hidden")).toBeTruthy();
    });
    
    it("should hide the failedSummary div after retry all", function() {
      createModule(1);
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              }
        }
      });
      expect($(".failedSummary").is(":visible")).toBeTruthy();
      $("#retryAllButton").trigger("click");
      expect($(".failedSummary").hasClass("hidden")).toBeTruthy();
    });
  
    it("should hide the abort button and show the continue button when all configurators are done", function() {
      createModule(4);
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 18,
                  "totalStates" : 18
              },
          "2" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 12,
                  "totalStates" : 12
              },
          "3" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 1,
                  "totalStates" : 1
              }
        }
      });
      expect($("#abortButton").hasClass("hidden")).toBeTruthy();
      expect($("#continueButton").is(":visible")).toBeTruthy();
      expect($("#backQuitButtons").is(":visible")).toBeTruthy();
    });
    
    it("should schedule next update when some configurators are not done", function() {
      createModule(2);
      spyOn(module, "scheduleNextUpdate").andCallThrough();
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 17,
                  "totalStates" : 18
              }
        }
      });
      expect(module.scheduleNextUpdate).toHaveBeenCalled();
    });
    
    it("should not schedule next update when all configurators are done", function() {
      createModule(2);
      spyOn(module, "scheduleNextUpdate");
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 18,
                  "totalStates" : 18
              }
        }
      });
      expect(module.scheduleNextUpdate).not.toHaveBeenCalled();
    });
    
    it("should update the failed count, failed waiting count and successful count correctly", function() {
      createModule(6);
      module.updateProgressTable({ 
        "configurators" : { 
          // Failed waiting
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : true,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 4,
                  "totalStates" : 5
              },
              // Failed
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 18,
                  "totalStates" : 18
              },
          "2" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 12,
                  "totalStates" : 12
              },
              // Successful
          "3" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 1,
                  "totalStates" : 1
              },
              "4" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 12,
                  "totalStates" : 12
              },
          "5" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 1,
                  "totalStates" : 1
              }
        }
      });
      expect(module.getFailedWaitingCount()).toEqual(1);
      expect(module.getFailedCount()).toEqual(2);
      expect(module.getSuccessfulCount()).toEqual(3);
    });
    
    it("should show abort buttons by default", function() {
      createModule(1);
      expect($('#abortButton').is(":visible")).toBeTruthy();
    });
    
    it("should show abort buttons after retry", function() {
      createModule(4);
      spyOn($, "publish");
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 18,
                  "totalStates" : 18
              },
          "2" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : true,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 12,
                  "totalStates" : 12
              },
          "3" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : false,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 1,
                  "totalStates" : 1
              }
        }
      });
      // All configurators finished.
      expect($("#abortButton").hasClass("hidden")).toBeTruthy();
      expect($.publish).wasCalledWith("hostInstallCompleted", [1, 2, 1]);
      // Call retry all.
      $("#retryAllButton").trigger("click");
      expect($('#abortButton').is(":visible")).toBeTruthy();
    });
    
    it("should retry configurators scheduled for retry", function() {
      createModule(2);
      // Schedule two iterators for retry.
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : true,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 4,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : true,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 7,
                  "totalStates" : 12
              }
        }
      });
      // Verify they are schduled for retry.
      expect(module.getFailedWaitingCount()).toEqual(2);
      // Invoke 'rollback and retry.'
      spyOn(module, "retry");
      $("#rollbackAndRetryAllButton").trigger("click");
      // Finish the configurators and check retry() has been called.
      module.updateProgressTable({ 
        "configurators" : { 
          "0" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 5,
                  "totalStates" : 5
              },
          "1" : { "displayState" : "Installing hue-common package...",
                  "failedState" : "",
                  "isErrorState" : true,
                  "isWaitingForRollback" : false,
                  "state" : "PACKAGE_INSTALL",
                  "stateNum" : 12,
                  "totalStates" : 12
              }
        }
      });
      expect(module.getFailedWaitingCount()).toEqual(0);
      expect(module.retry).toHaveBeenCalled();
    });
    
  });

});
