let templateList = [];
let fieldSelectList = [];
let messageRequest = {
    templateCd: "",
    parameterMap: {}
}
let failOverRequest = {
    templateCd: "",
    checked: false,
    parameterMap: {}
}
let _eventDefinitionModel = {};
let _requestedInteractionData = {};
let applicationExtensionKey = '';

define(['postmonger'], function (Postmonger) {
    'use strict';

    // let connection = new (new window.MockPostmonger()).Session(); // fortesting

    let connection = new Postmonger.Session();
    let authTokens = {};
    let payload = {};

    // Configuration variables
    let requestSchemaData;

    $(window).ready(onRender);
    connection.on('initActivity', initialize);
    connection.on('clickedNext', save); //Save function within MC

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');

        // if no payload data attribute more than 3 seconds, hide content
        setTimeout(() => {
            if (Object.keys(payload).length === 0) {
                $('#loading-spinner').hide();
                $('.container').hide();
                // alert('Cannot use this custom activity. Please try again.');
            }
        }, 2000);

        //fortesting
        // $('#loading-spinner').hide();

        $('#fail-over-construct').hide();

        // Get a reference to the select element
        document.getElementById('form-activity').addEventListener('submit', function (e) {
            e.preventDefault();
            save();
        });
        document.getElementById('template-select').addEventListener('change', onChangeTemplateSelect);
        document.getElementById('fail-over-template-select').addEventListener('change', onChangeFailOverTemplateSelect);

    }

    function constructMappingElement(templateIndexValues, parameterMap, elementId) {

        const fieldListSelectOptionsHTML = '<option value="">Select Field</option>' +
            fieldSelectList.map(field => {
                return `<option value="${field.value}">${field.label}</option>`;
            });

        const messageConstruct = document.createElement('div');
        messageConstruct.id = elementId;
        for (let field in templateIndexValues) {
            const inputEle = document.createElement('input');
            inputEle.type = 'text';
            inputEle.id = field + '-index';
            inputEle.name = field + '-index';
            inputEle.readOnly = true;
            inputEle.value = field;
            inputEle.className = 'slds-input';

            const formEleControl = document.createElement('div');
            formEleControl.className = 'slds-form-element__control';
            formEleControl.appendChild(inputEle);

            const divEleContainer = document.createElement('div');
            divEleContainer.className = 'slds-form-element';
            divEleContainer.appendChild(formEleControl);

            const divCol1Ele = document.createElement('div');
            divCol1Ele.className = 'slds-col';
            divCol1Ele.appendChild(divEleContainer);

            const divCol2Ele = document.createElement('div');
            divCol2Ele.className = 'slds-col';

            const selectFormControlEle = document.createElement('div');
            selectFormControlEle.className = 'slds-form-element__control';
            const sldsSelectContainer = document.createElement('div');
            sldsSelectContainer.className = 'slds-select_container';

            // display field select list
            const selectEle = document.createElement('select');
            selectEle.id = field + '-field';
            selectEle.className = 'slds-select';
            selectEle.innerHTML = fieldListSelectOptionsHTML;
            selectEle.onchange = onChangeFieldSelect.bind(this, parameterMap, field);
            selectEle.value = parameterMap[field] || '';
            sldsSelectContainer.appendChild(selectEle);
            selectFormControlEle.appendChild(sldsSelectContainer);
            divCol2Ele.appendChild(selectFormControlEle);

            const divRowEle = document.createElement('div');
            divRowEle.className = 'slds-grid slds-gutters slds-m-bottom_x-small';
            divRowEle.appendChild(divCol1Ele);
            divRowEle.appendChild(divCol2Ele);

            messageConstruct.appendChild(divRowEle);
        };

        return messageConstruct;
    }

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', function (eventDefinitionModel) {
        if (eventDefinitionModel) {
            console.log('Request Trigger >>>', eventDefinitionModel);
            _eventDefinitionModel = eventDefinitionModel;
        }
    });

    async function initialize(data) {
        if (data) {
            console.log('Data >>', data);
            payload = data;
        }

        await new Promise((resolve) => {
            connection.trigger('requestInteraction');
            connection.on('requestedInteraction', (interactionData) => {
                parseEventInteraction(interactionData);
                resolve();
            });
        });

        await checkToken();
        await getTemplates();

        await new Promise((resolve) => {
            connection.trigger('requestSchema');
            connection.on('requestedSchema', (schemaData) => {
                parseEventSchema(schemaData);
                resolve();
            });
        });

        initialLoad(data);

    }

    /**
     * Save function is fired off upon clicking of "Done" in Marketing Cloud
     * The config.json will be updated here if there are any updates to be done via Front End UI
     */
    function save() {
        console.log('messageRequest: ', messageRequest);
        console.log('failOverRequest: ', failOverRequest);

        let testSendInput = $("#test-send-input").val();
        let lineAccountSelect = $("#line-account-select").val();
        payload['arguments'] = payload['arguments'] || {};
        payload['arguments'].execute = payload['arguments'].execute || {};
        const inArguments = [];
        let attributesMapping = {};
        attributesMapping['testSend'] = {
            "phone": testSendInput,
            "lineAccount": lineAccountSelect
        };
        attributesMapping['additionalMap'] = {
            journeyName: _requestedInteractionData.name,
            campaignName: document.getElementById('input-campaign-name').value,
            costCenter: document.getElementById('input-cost-center').value
        }
        attributesMapping['messageRequest'] = messageRequest;
        attributesMapping['failOverRequest'] = failOverRequest;
        attributesMapping['data'] = {};
        requestSchemaData['schema'].forEach((schema) => {
            if (schema.name) {
                let schemaKeyReplaced = schema.key.replace(schema.name, '"' + schema.name + '"');
                let splitArr = schema.key.toLowerCase().replace(/ /g, '').split(".");
                attributesMapping['data'][splitArr[splitArr.length - 1]] = '{{' + schemaKeyReplaced + '}}';
            }
        });

        inArguments.push(attributesMapping);

        payload['arguments'].execute.inArguments = inArguments;
        payload['metaData'].isConfigured = true;
        console.log('Payload >>', payload);
        connection.trigger('updateActivity', payload);
    }

    /**
     * 
     * @param {*} data
     * 
     * This data param is the config json payload that needs to be loaded back into the UI upon opening the custom application within journey builder 
     * This function is invoked when the user clicks on the custom activity in Marketing Cloud. 
     * If there are information present, it should be loaded back into the appropriate places. 
     * e.g. input fields, select lists
     */
    function initialLoad(data) {
        if (data && data['arguments'] && data['arguments'].execute && data['arguments'].execute.inArguments.length) {
            messageRequest = data['arguments'].execute.inArguments[0].messageRequest;

            const radioTemplateType = document.getElementById('radio-template-' + (messageRequest.type)?.toLowerCase());
            if (radioTemplateType) {
                radioTemplateType.checked = true;
                onChangeRadioTemplateType((messageRequest.type));
            }

            $('#template-select').val(messageRequest.templateCd);
            onChangeTemplateSelect();

            failOverRequest = data['arguments'].execute.inArguments[0].failOverRequest;

            const radioFailOverTemplateType = document.getElementById('radio-fail-over-template-' + (failOverRequest.type)?.toLowerCase());
            if (radioFailOverTemplateType) {
                radioFailOverTemplateType.checked = true;
                onChangeRadioFailOverTemplateType((failOverRequest.type));
            }

            $('#fail-over-template-select').val(failOverRequest.templateCd);
            onChangeFailOverTemplateSelect();

            document.getElementById('checkbox-fail-over').checked = failOverRequest.checked;
            checkFailOverMessage();


            $('#test-send-input').val(data['arguments'].execute.inArguments[0].testSend?.phone);
            $('#line-account-select').val(data['arguments'].execute.inArguments[0].testSend?.lineAccount);

            $('#input-campaign-name').val(data['arguments'].execute.inArguments[0].additionalMap?.campaignName);
            $('#input-cost-center').val(data['arguments'].execute.inArguments[0].additionalMap?.costCenter);

        } else { // no arguments data
            onChangeRadioTemplateType('LON');
            onChangeRadioFailOverTemplateType('SMS');
        }
    };


    /**
     * This function is to pull the relevant information to create the schema of the objects
     * 
     * This function pulls out the schema for additional customizations that can be used.
     * The schema is used to create the fields that are available in the select list.
     * 
     */
    function parseEventSchema(data) {
        requestSchemaData = data;

        console.log('Schema >>', requestSchemaData);
        // save schema
        let dataJson = requestSchemaData['schema'];

        for (let i = 0; i < dataJson.length; i++) {

            // Create a select list of the event schema
            let splitArr = dataJson[i]['key'].toLowerCase().replace(/ /g, '').split(".");
            let selection = {
                "label": dataJson[i]['name'],
                "value": splitArr[splitArr.length - 1]
            };
            fieldSelectList.push(selection);
        }

        console.log('Field Select List >>', fieldSelectList);

        // Add the select list to the UI
        $('#field-select').append(fieldSelectList.map(function (field) {
            return '<option value="' + field.value + '">' + field.label + '</option>';
        }));
    }

    function parseEventInteraction(data) {
        _requestedInteractionData = data;

        console.log('Interaction >>', _requestedInteractionData);

        const customActivity = _requestedInteractionData.activities.find(activity => activity.key === payload?.key);
        if(customActivity) {
            applicationExtensionKey = customActivity.configurationArguments.applicationExtensionKey;
        }
    }

    function onChangeTemplateSelect() {
        const templateSelect = document.getElementById('template-select');

        const selectedTemplateItem = templateList.find(template => template.id === templateSelect.value);

        console.log('Template selected >>', selectedTemplateItem);

        messageRequest.templateCd = selectedTemplateItem?.id;

        $('#fail-over-construct').hide();
        const messageConstruct = document.getElementById('message-construct');
        messageConstruct.innerHTML = '';

        const templateIndexRecipient = selectedTemplateItem?.recipient;
        if (templateIndexRecipient && Object.keys(templateIndexRecipient).length) {
            messageRequest.recipient = {
                ...templateIndexRecipient,
                ...messageRequest.recipient,
            };
        }
        messageConstruct.appendChild(constructMappingElement(templateIndexRecipient, messageRequest.recipient, 'recipient'));

        const templateIndexValues = selectedTemplateItem?.values;
        if (templateIndexValues && Object.keys(templateIndexValues).length) {
            $('#fail-over-construct').show();
            const checkboxFailOver = document.getElementById('checkbox-fail-over');
            // uncheck
            checkboxFailOver.checked = false;
            $('#fail-over-message').hide();
            failOverRequest.checked = false;

            messageRequest.parameterMap = {
                ...templateIndexValues,
                ...messageRequest.parameterMap,
            };
        }
        messageConstruct.appendChild(constructMappingElement(templateIndexValues, messageRequest.parameterMap, 'parameterMap'));

    }

    function onChangeFailOverTemplateSelect() {
        const failOverTemplateSelect = document.getElementById('fail-over-template-select');
        const selectedTemplateItem = templateList.find(template => template.id === failOverTemplateSelect.value);

        console.log('Fail Over Template selected >>', selectedTemplateItem);

        const failOverMessageConstruct = document.getElementById('fail-over-message-construct');
        failOverMessageConstruct.innerHTML = '';

        const failOverTemplateIndexRecipient = selectedTemplateItem?.recipient;
        if (failOverTemplateIndexRecipient && Object.keys(failOverTemplateIndexRecipient).length) {
            failOverRequest.recipient = {
                ...failOverTemplateIndexRecipient,
                ...failOverRequest.recipient,
            };
        }
        failOverMessageConstruct.appendChild(constructMappingElement(failOverTemplateIndexRecipient, failOverRequest.recipient, 'failoverRecipient'))

        const failOverTemplateIndexValues = selectedTemplateItem?.values;

        if (failOverTemplateIndexValues && Object.keys(failOverTemplateIndexValues).length) {
            failOverRequest.templateCd = selectedTemplateItem?.id;
            failOverRequest.parameterMap = {
                ...failOverTemplateIndexValues,
                ...failOverRequest.parameterMap
            }
        }

        failOverMessageConstruct.appendChild(constructMappingElement(failOverTemplateIndexValues, failOverRequest.parameterMap, 'failoverParameterMap'));

        console.log('messageRequest: ', messageRequest);
        console.log('failOverRequest: ', failOverRequest);
    }

    async function checkToken() {
        // Display loading spinner
        $('#loading-spinner').show();
        // check token by calling API
        const response = await callApi('sfmc/verify-token', { token: applicationExtensionKey }).catch(error => console.error('Error:', error));

        // Hide loading spinner
        $('#loading-spinner').hide();
    }
});

async function getTemplates() {
    $('#loading-spinner').show();

    const response = await callApi('sfmc/message-template', null, 'GET').catch(error => console.error('Error:', error));

    const resBody = await response.json();
    console.log('Templates Response >>', resBody);

    if (resBody.status == "success") {
        templateList = resBody.data;
        const templateSelect = document.getElementById('template-select');
        const failOverTemplateSelect = document.getElementById('fail-over-template-select');

        templateSelect.innerHTML = failOverTemplateSelect.innerHTML = `<option value="">Select Template</option>` +
            templateList.map(template => {
                return `<option value="${template.id}">${template.id}</option>`;
            });
    }
    $('#loading-spinner').hide();
}

function checkFailOverMessage() {
    const checkboxFailOver = document.getElementById('checkbox-fail-over');
    if (checkboxFailOver.checked) {
        $('#fail-over-message').show();
        failOverRequest.checked = true;
    } else {
        $('#fail-over-message').hide();
        failOverRequest.checked = false;
    }
}


function onChangeFieldSelect(parameterMap, field, event) {
    const selectedField = event.target.value;
    parameterMap[field] = selectedField;
}

function onChangeRadioTemplateType(type) {
    const templateSelect = document.getElementById('template-select');

    templateSelect.innerHTML = `<option value="">Select Template</option>` +
        templateList.filter(t => t.type == type).map(template => {
            return `<option value="${template.id}">${template.id}</option>`;
        });

    messageRequest.type = type;
}

function onChangeRadioFailOverTemplateType(type) {
    const failOverTemplateSelect = document.getElementById('fail-over-template-select');

    failOverTemplateSelect.innerHTML = `<option value="">Select Template</option>` +
        templateList.filter(t => t.type == type).map(template => {
            return `<option value="${template.id}">${template.id}</option>`;
        });

    failOverRequest.type = type;

}

async function testSend() {
    const testSendInput = $("#test-send-input").val();
    const lineAccountSelect = $("#line-account-select").val();

    let attributesMapping = {};
    attributesMapping['testSend'] = {
        "phone": testSendInput,
        "lineAccount": lineAccountSelect,
        "dataExtensionId": _eventDefinitionModel.dataExtensionId
    };
    attributesMapping['messageRequest'] = messageRequest;
    attributesMapping['failOverRequest'] = failOverRequest;
    attributesMapping['additionalMap'] = {
        journeyName: _requestedInteractionData.name,
        campaignName: document.getElementById('input-campaign-name').value,
        costCenter: document.getElementById('input-cost-center').value
    }

    console.log(attributesMapping);

    // get button element by id
    const testSendButton = document.getElementById('btn-test-send');
    testSendButton.disabled = true;

    // change label
    testSendButton.innerHTML = 'Sending...';

    const resultElement = document.getElementById('test-send-result-box');
    resultElement.innerHTML = '';

    const response = await callApi('message/test-send', attributesMapping).catch(error => console.error('Error:', error)).finally(() => {
        // change label
        testSendButton.innerHTML = 'Send';
        testSendButton.disabled = false;
    });

    const resBody = await response.json();
    if(resBody.data?.data) {
       const data = resBody.data.data;
       const isSuccess = resBody.data.messageRes?.status?.isSuccess;
       const errorMsg = resBody.data.messageRes?.status?.message;
       
       const resultContainer = document.createElement('div');
        resultContainer.className = 'slds-box slds-box_x-small slds-theme_shade slds-m-top_small';

        const dl = document.createElement('dl');
        dl.className = 'slds-dl_inline';

        for(let key in data) {
            const dt = document.createElement('dt');
            dt.className = 'slds-dl_inline__label';
            dt.innerHTML = key+': ';

            const dd = document.createElement('dd');
            dd.className = 'slds-dl_inline__detail';
            dd.innerHTML = data[key];

            dl.appendChild(dt);
            dl.appendChild(dd);
        }

        const resultTextEle = document.createElement('div');
        resultTextEle.className = isSuccess ? 'slds-text-color_success' : 'slds-text-color_error';
        resultTextEle.innerHTML = isSuccess ? 'Test message successfully sent' : 'Failed to send the test message: '+ errorMsg;
        
        resultContainer.appendChild(resultTextEle);
        resultContainer.appendChild(dl);
        resultElement.appendChild(resultContainer);
    }
}

async function callApi(endpoint, body, method = 'POST') {
    const response = await fetch(`https://line-lon-custom-activity-866c589e48fd.herokuapp.com/${endpoint}`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'app-token': applicationExtensionKey
        },
        body: method == 'GET' ? null : JSON.stringify(body),
    });

    return response;
}

