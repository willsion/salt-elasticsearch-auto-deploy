// Copyright (c) 2012 Cloudera, Inc.  All rights reserved.
define([
  "cloudera/cmf/wizard/WizardStepBase",
  "cloudera/common/UrlParams",
  "knockout",
  "underscore"
], function (WizardStepBase, UrlParams, ko, _) {
  "use strict";

  return WizardStepBase.extend({
    /**
     * options: {
     *   id: (required) "the id of the step"
     * }
     */
    init: function(options) {
      var self = this;
      self.initParams();
      self.$container = $("#" + options.id);
      self.$form = self.$container.closest("form");
      self._super.apply(self, arguments);
    },

    beforeLeave: function(callback) {
      var result = this.checkSSHPage();
      if (result) {
        this.$form.submit();
        callback();
      } else {
        var $firstWizardStepWithError = this.$form.find(".error:first:visible").closest(".wizard-step").parent();
        if ($firstWizardStepWithError.length > 0) {
          var id = $firstWizardStepWithError.attr("id");
          UrlParams.set("step", id);
        }
      }
    },

    /**
     * Initialize the knockout state.
     */
    initParams: function() {
      var self = this;

      // various things for the SSH page.
      // "true" if root selected.
      self.isRoot = ko.observable("true");

      // the other username.
      self.username = ko.observable("");

      // Authentication method, whether to use password or passphrase.
      self.usePassword = ko.observable("true");

      // Password & confirmation.
      self.password = ko.observable("");

      self.passwordConfirm = ko.observable("");

      // Passphrase & confirmation.
      self.passphrase = ko.observable("");
      self.passphraseConfirm = ko.observable("");

      // No need to show any errors initially.
      self.usernameError = ko.observable("");
      self.passwordError = ko.observable("");
      self.passphraseError = ko.observable("");
      self.privateKeyError = ko.observable("");

      /**
       * Returns true if the passwords match.
       */
      self.passwordMatch = ko.computed(function () {
        return self.usePassword() !== 'true' || self.password() === self.passwordConfirm();
      });

      /**
       * Returns true if the passphrases match.
       */
      self.passphraseMatch = ko.computed(function () {
        return self.usePassword() === 'true' || self.passphrase() === self.passphraseConfirm();
      });

      /**
       * Returns true if there is a user.
       */
      self.userEntered = ko.computed(function () {
        return self.isRoot() === 'true' || self.username() !== '';
      });

      function resetErrors () {
        self.$container.find(".control-group").removeClass("error");
        self.passwordError("");
        self.passphraseError("");
        self.usernameError("");
        self.privateKeyError("");
      }

      function focusAndSelect($el, showError){
        if (showError) {
          $el.closest(".control-group").addClass("error");
        }
        $el.focus();
        $el.select();
      }

      function checkFormValid () {
        return self.$form.valid();
      }

      function checkUsername () {
        if (!self.userEntered()) {
          self.usernameError($("#messagesUsernameNotEntered").text());
          focusAndSelect(self.$container.find("input[name=username]"), true);
          return false;
        }
        return true;
      }

      function checkPasswordMatch () {
        if (!self.passwordMatch()) {
          self.passwordError($("#messagesPasswordDontMatch").text());
          focusAndSelect(self.$container.find("input[name=passwordConfirm]"), true);
          focusAndSelect(self.$container.find("input[name=password]"), true);
          return false;
        }
        return true;
      }

      function checkPassphraseMatch () {
        if (!self.passphraseMatch()) {
          self.passphraseError($("#messagesPassphraseDontMatch").text());
          focusAndSelect(self.$container.find("input[name=passphraseConfirm]"), true);
          focusAndSelect(self.$container.find("input[name=passphrase]"), true);
          return false;
        }
        return true;
      }

      function checkEmptyPassword () {
        if (self.password() === '' && self.passwordConfirm() === '') {
          if (!confirm($("#messagesContinueWithoutPasswordPrompt").text())) {
            focusAndSelect(self.$container.find("input[name=password]"), false);
            return false;
          }
        }
        return true;
      }

      function checkEmptyPassphrase () {
        if (self.passphrase() === '' && self.passphraseConfirm() === '') {
          if (!confirm($("#messagesContinueWithoutPassphrasePrompt").text())) {
            focusAndSelect(self.$container.find("input[name=passphrase]"), false);
            return false;
          }
        }
        return true;
      }

      function checkEmptyPrivateKey() {
        var result = true;
        if (self.$container.find("[name=privateKey]").val() === '') {
          self.privateKeyError($("#messagesMissingPrivateKey").text());
          focusAndSelect(self.$container.find("input[name=privateKey]"), true);
          result = false;
        }
        return result;
      }

      self.checkSSHPage = function () {
        resetErrors();
        if (!checkFormValid()) {
          return false;
        }
        var result = checkUsername();

        // checkXXXMatch is always executed because
        // we want to show all the errors.
        // checkEmptyXXX is only executed if
        // everything else passes.
        if (self.usePassword() === 'true') {
          result = checkPasswordMatch() && result;
          result = result && checkEmptyPassword();
        } else {
          result = checkPassphraseMatch() && result;
          result = checkEmptyPrivateKey() && result;
          result = result && checkEmptyPassphrase();
        }
        return result;
      };

    }
  });
});
