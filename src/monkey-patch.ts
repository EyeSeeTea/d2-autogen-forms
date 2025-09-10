// @ts-nocheck

// In DataEntry the history modal always use the current period.
// This is a monkey patch to add the possibility to pass a period as
// a parameter to all the methods involved in the history modal.

// This is required for the autogen-forms functionality where the
// period can be different from the selected one. (eg. grid-with-periods)

export {};

window.CommentSaver = function CommentSaver(de, co, comment) {
    var pe = window.autogenFormCurrentPeriodId || $("#selectedPeriodId").val();
    var ds = $("#selectedDataSetId").val();
    var ou = dhis2.de.currentOrganisationUnitId;

    var dataValue = {
        de: de,
        co: co,
        ds: ds,
        ou: ou,
        pe: pe,
        comment: comment,
    };

    if ($("#input-" + de + "-" + co + "-val").length) {
        dataValue.value = $("#input-" + de + "-" + co + "-val").val();
    }

    var cc = dhis2.de.getCurrentCategoryCombo();
    var cp = dhis2.de.getCurrentCategoryOptionsQueryValue();

    if (cc && cp) {
        dataValue.cc = cc;
        dataValue.cp = cp;
    }

    this.save = function () {
        markComment(dhis2.de.cst.colorYellow);

        $.ajax({
            url: "../api/dataValues",
            data: dataValue,
            dataType: "json",
            type: "POST",
            success: handleSuccess,
            error: handleError,
        });
    };

    function handleSuccess(json) {
        markComment(dhis2.de.cst.colorGreen);
    }

    function handleError(xhr, textStatus, errorThrown) {
        if (xhr.status === 201) {
            markComment(dhis2.de.cst.colorGreen);
        } else {
            var errorText = JSON.parse(xhr.responseText);
            markComment(dhis2.de.cst.colorRed);
            window.alert(i18n_saving_comment_failed_error_code + "\n\n" + errorText.message);
        }
    }
};

window.refreshChart = function refreshChart() {
    var periodId = window.autogenFormCurrentPeriodId || $("#selectedPeriodId").val();

    var source =
        "../api/visualizations/history/data.png?de=" +
        encodeURIComponent(currentDataElementId) +
        "&co=" +
        encodeURIComponent(currentOptionComboId) +
        "&cp=" +
        encodeURIComponent(currentAttributeOptionComboId) +
        "&pe=" +
        encodeURIComponent(periodId) +
        "&ou=" +
        encodeURIComponent(dhis2.de.currentOrganisationUnitId) +
        "&r=" +
        Math.random();

    $("#historyChart").attr("src", source);
};

window.markValueForFollowup = function markValueForFollowup() {
    var periodId = window.autogenFormCurrentPeriodId || $("#selectedPeriodId").val();

    var dataSetId = $("#selectedDataSetId").val();

    var dataValue = {
        de: currentDataElementId,
        co: currentOptionComboId,
        ou: dhis2.de.currentOrganisationUnitId,
        pe: periodId,
        ds: dataSetId,
        followUp: true,
    };

    var cc = dhis2.de.getCurrentCategoryCombo();
    var cp = dhis2.de.getCurrentCategoryOptionsQueryValue();

    if (cc && cp) {
        dataValue.cc = cc;
        dataValue.cp = cp;
    }

    $.ajax({
        url: "../api/dataValues",
        data: dataValue,
        dataType: "text",
        type: "post",
        success: function (json) {
            if ($("#followup").attr("src") == "../images/unmarked.png") {
                $("#followup").attr("src", "../images/marked.png");
                $("#followup").attr("alt", i18n_unmark_value_for_followup);
            } else {
                $("#followup").attr("src", "../images/unmarked.png");
                $("#followup").attr("alt", i18n_mark_value_for_followup);
            }
        },
    });
};

window.viewHist = function viewHist(dataElementId, optionComboId, period) {
    var periodId = window.autogenFormCurrentPeriodId || period || $("#selectedPeriodId").val();

    if (dataElementId && optionComboId && periodId && periodId != -1) {
        var dataElementName = getDataElementName(dataElementId);
        var optionComboName = getOptionComboName(optionComboId);
        var operandName = dataElementName + " " + optionComboName;

        var params = {
            dataElementId: dataElementId,
            optionComboId: optionComboId,
            periodId: periodId,
            organisationUnitId: dhis2.de.getCurrentOrganisationUnit(),
        };

        var cc = dhis2.de.getCurrentCategoryCombo();
        var cp = dhis2.de.getCurrentCategoryOptionsQueryValue();

        if (cc && cp) {
            params.cc = cc;
            params.cp = cp;
        }

        $("#historyDiv").load("viewHistory.action", params, function (response, status, xhr) {
            if (status == "error") {
                window.alert(i18n_operation_not_available_offline);
            } else {
                displayHistoryDialog(operandName);
            }
        });
    }
};
