// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(["cloudera/common/I18n"], function(I18n) {
  if ($.validator && $.validator.messages) {
    // when we are not logged in, we don't ask for
    // the resources/language/ui request,
    // So it is possible that these messages
    // are not translated.
    if (I18n.t("ui.validator.accept") !== "ui.validator.accept") {
      $.extend($.validator.messages, {
        accept: I18n.t("ui.validator.accept"),
        creditcard: I18n.t("ui.validator.creditcard"),
        date: I18n.t("ui.validator.date"),
        dateISO: I18n.t("ui.validator.dateISO"),
        digits: I18n.t("ui.validator.digits"),
        email: I18n.t("ui.validator.email"),
        equalTo: I18n.t("ui.validator.equalTo"),
        number: I18n.t("ui.validator.number"),
        remote: I18n.t("ui.validator.remote"),
        required: I18n.t("ui.validator.required"),
        url: I18n.t("ui.validator.url")
      });
    }
  }
});
