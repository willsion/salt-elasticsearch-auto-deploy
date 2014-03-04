// (c) Copyright 2012 Cloudera, Inc. All rights reserved.
define(["cloudera/common/I18n"], function(I18n) {
  var initialize = function(dataTable) {
    if (!dataTable.oLanguage) {
      dataTable.oLanguage = {};
    }
    dataTable.oLanguage.sProcessing = I18n.t("ui.dataTable.sProcessing");
    dataTable.oLanguage.sZeroRecords = I18n.t("ui.dataTable.sZeroRecords");
    dataTable.oLanguage.sInfo = I18n.t("ui.dataTable.sInfo");
    dataTable.oLanguage.sInfoEmpty = I18n.t("ui.dataTable.sInfoEmpty");
    dataTable.oLanguage.sInfoFiltered = I18n.t("ui.dataTable.sInfoFiltered");
    dataTable.oLanguage.sSearch = I18n.t("ui.dataTable.sSearch");
    if (!dataTable.oPaginate) {
      dataTable.oLanguage.oPaginate = {};
    }
    dataTable.oLanguage.oPaginate.sFirst = I18n.t("ui.dataTable.sFirst");
    dataTable.oLanguage.oPaginate.sPrevious = I18n.t("ui.dataTable.sPrevious");
    dataTable.oLanguage.oPaginate.sNext = I18n.t("ui.dataTable.sNext");
    dataTable.oLanguage.oPaginate.sLast = I18n.t("ui.dataTable.sLast");
  };
  return {
    initialize: initialize
  };
});
