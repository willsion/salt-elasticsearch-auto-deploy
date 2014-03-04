define([
  "cloudera/common/I18n"
], function(I18n) {

if (window.resources === undefined) {
  window.resources = {};
}

window.resources.ui = {
  "ui.all" : "All",
  "ui.commands" : "Commands",
  "ui.components" : "Components",
  "ui.configuration" : "Configuration",
  "ui.current" : "Current",
  "ui.customDate" : "Custom Date",
  "ui.display" : "Display",
  "ui.error" : "Error",
  "ui.entries" : "Entries",
  "ui.facet.__no_facetting__": "All Separate",
  "ui.facet.__single_plot__": "All Combined",
  "ui.audits" : "Audits",
  "ui.installDetails" : "Install Details",
  "ui.installIncomplete" : "Install Incomplete",
  "ui.instances" : "Instances",
  "ui.nErrors" : "{0} Error(s)",
  "ui.nWarnings" : "{0} Warning(s)",
  "ui.na" : "n/a",
  "ui.no" : "No",
  "ui.none" : "None",
  "ui.ok" : "OK",
  "ui.manageQuota" : "Manage Quota",
  "ui.properties" : "Properties",
  "ui.resources" : "Resources",
  "ui.status" : "Status",
  "ui.validator.accept" : "Please enter a value with a valid extension.",
  "ui.validator.creditcard" : "Please enter a valid credit card number.",
  "ui.validator.date" : "Please enter a valid date.",
  "ui.validator.dateISO" : "Please enter a valid date (ISO).",
  "ui.validator.digits" : "Please enter only digits.",
  "ui.validator.email" : "Please enter a valid email address.",
  "ui.validator.equalTo" : "Please enter the same value again.",
  "ui.validator.number" : "Please enter a valid number.",
  "ui.validator.remote" : "Please fix this field.",
  "ui.validator.required" : "This field is required.",
  "ui.validator.url" : "Please enter a valid URL.",
  "ui.wildcardTest" : "Hello {0}",
  "ui.yes" : "Yes"
};

describe("I18n Tests", function() {
  it("should translated strings.", function() {
    expect(I18n.t("ui.commands")).toEqual("Commands");
    expect(I18n.t("ui.status")).toEqual("Status");
    expect(I18n.t("ui.wildcardTest", "world")).toEqual("Hello world");
    expect(I18n.t("ui.untranslatedRubbish")).toEqual("ui.untranslatedRubbish");
  });
});
});
