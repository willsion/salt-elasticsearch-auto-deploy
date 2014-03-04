// (c) Copyright 2011-2012 Cloudera, Inc. All rights reserved.
define([
  'cloudera/Util',
  'cloudera/common/UrlParams',
  'cloudera/cmf/wizard/hosts/HostCredentialsStep'
], function(Util, UrlParams, HostCredentialsStep) {
  describe("HostCredentialsStep Tests", function() {
    var step, ui = '<form id="thisForm"><div id="credentialStep"><div class="wizard-step">' +
        '<input name="privateKey"></input>' +
        '<div id="messagesContinueWithoutPasswordPrompt">message.addHostsSSH.continueWithoutPasswordPrompt</div>' +
        '<div id="messagesContinueWithoutPassphrasePrompt">message.addHostsSSH.continueWithoutPassphrasePrompt</div>' +
        '<div id="messagesPasswordDontMatch">message.addHostsSSH.passwordDontMatch</div>' +
        '<div id="messagesPassphraseDontMatch">message.addHostsSSH.passphraseDontMatch</div>' +
        '<div id="messagesUsernameNotEntered">message.addHostsSSH.usernameNotEntered</div>' +
        '<div id="messagesMissingPrivateKey">message.addHostsSSH.missingPrivateKey</div>' +
        '</div></div></form>';

    beforeEach(function() {
      $(ui).appendTo(document.body);
    });

    afterEach(function() {
      $("#thisForm").remove();
    });

    it("should check the default credentials", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("true");
      step.password("123");
      step.passwordConfirm("123");
      expect(step.checkSSHPage()).toBeTruthy();
    });

    it("should check the default credentials", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("true");
      step.password("123");
      step.passwordConfirm("123");
      expect(step.checkSSHPage()).toBeTruthy();
    });

    it("should find that password do not match", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("true");
      step.password("1234-blah");
      step.passwordConfirm("123");
      expect(step.checkSSHPage()).toBeFalsy();
      expect(step.passwordError()).toEqual("message.addHostsSSH.passwordDontMatch");
    });

    it("should find that username is not entered", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.isRoot('false');
      step.username('');
      step.usePassword("true");
      step.password("123");
      step.passwordConfirm("123");
      expect(step.checkSSHPage()).toBeFalsy();
      expect(step.userEntered()).toBeFalsy();
      expect(step.usernameError()).toEqual("message.addHostsSSH.usernameNotEntered");
    });

    it("should find that username is entered", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.isRoot('false');
      step.username('foo');
      step.usePassword("true");
      step.password("123");
      step.passwordConfirm("123");
      expect(step.checkSSHPage()).toBeTruthy();
      expect(step.userEntered()).toBeTruthy();
      expect(step.usernameError()).toEqual("");
    });

    it("should find that passphrase do not match", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("false");
      step.passphrase("123");
      step.passphraseConfirm("1234");
      expect(step.checkSSHPage()).toBeFalsy();
      expect(step.passphraseError()).toEqual("message.addHostsSSH.passphraseDontMatch");
    });

    it("should find that passphrase key is empty", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("false");
      step.passphrase("123");
      step.passphraseConfirm("123");
      expect(step.checkSSHPage()).toBeFalsy();
      expect(step.privateKeyError()).toEqual("message.addHostsSSH.missingPrivateKey");
    });

    it("should find that passphrase is fine", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });

      step.usePassword("false");
      step.passphrase("123");
      step.passphraseConfirm("123");
      step.$container.find("[name=privateKey]").val("dummyKey");
      expect(step.checkSSHPage()).toBeTruthy();
      expect(step.privateKeyError()).toEqual("");
    });

    it("should show the page with an existing error", function() {
      step = new HostCredentialsStep({
        id: "credentialStep"
      });
      var called = false, callback = function() {
        called = true;
      };
      spyOn(UrlParams, 'set');
      // simulate an error validation.
      step.usePassword("false");
      step.passphrase("123");
      step.passphraseConfirm("123");
      step.$container.find("[name=privateKey]").addClass("error");
      step.beforeLeave(callback);
      expect(UrlParams.set).wasCalledWith("step", "credentialStep");
    });
  });
});
