define(['postmonger'], function (Postmonger) {
    'use strict';

    let connection = new Postmonger.Session();
    let authTokens = {};
    let payload = {};

    // Configuration variables
    let eventSchema = ''; // variable is used in parseEventSchema()
    let lastnameSchema = ''; // variable is used in parseEventSchema()
    let eventDefinitionKey;
    let fieldSelectList = [];
    let selectedValueMergeField = '';
    // fortesting
    // let requestSchemaData = {
    //     schema: [
    //         {
    //             "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Name",
    //             "name": "Name",
    //             "type": "Text",
    //             "length": 50,
    //             "default": null,
    //             "isNullable": null,
    //             "isPrimaryKey": null
    //         },
    //         {
    //             "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Mobile",
    //             "name": "Mobile",
    //             "type": "Text",
    //             "length": 50,
    //             "default": null,
    //             "isNullable": null,
    //             "isPrimaryKey": null
    //         },
    //         {
    //             "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Birth Date",
    //             "name": "Birth Date",
    //             "type": "Date",
    //             "length": null,
    //             "default": null,
    //             "isNullable": null,
    //             "isPrimaryKey": null
    //         }
    //     ]
    // }
    let requestSchemaData;
    let requestedInteractionData;
    let templateList = [];

    $(window).ready(onRender);
    connection.on('initActivity', initialize);
    connection.on('clickedNext', save); //Save function within MC

    // fortesting
    // parseEventSchema();
    // getTemplates();

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        // connection.trigger('requestTokens');
        // connection.trigger('requestEndpoints');

        // if no payload data attribute more than 3 seconds, hide content
        setTimeout(() => {
            if(Object.keys(payload).length === 0){
                $('#loading-spinner').hide();
                $('.container').hide();
                // alert('Cannot use this custom activity. Please try again.');
            }
        }, 2000);

        //fortesting
        // $('#loading-spinner').hide();

        $('#fail-over-construct').hide();

        // Get a reference to the select element
        const fieldSelect = document.getElementById('field-select');
        const formActivity = document.getElementById('form-activity');
        const jsonTextArea = document.getElementById("textarea-message-input");
        const textareaFormElement = document.getElementById('textarea-form-element'); 
        const validateButton = document.getElementById("validate-json-button");
        const validationMessage = document.getElementById("validation-message");
        const templateSelect = document.getElementById('template-select');
        const failOverTemplateSelect = document.getElementById('fail-over-template-select');

        // fieldSelect.addEventListener('change', function () {
        //     // Get the selected value
        //     const selectedValue = fieldSelect.value;
        //     selectedValueMergeField = selectedValue !== '' ? '%%' + selectedValue + '%%' : '';

        //     // Change value of input id merge-field-value
        //     document.getElementById('merge-field-value').value = selectedValueMergeField;
        // });

        formActivity.addEventListener('submit', function (e) {
            e.preventDefault();
            save();
        });

        // validateButton.addEventListener("click", () => {
        //     const jsonInput = jsonTextArea.value;
        //     const isValid = validateJSONFormat(jsonInput);

        //     if (isValid) {
        //         // Valid JSON format
        //         validationMessage.textContent = "Valid JSON format!";
        //         validationMessage.classList.add('slds-text-color_success');
        //         validationMessage.classList.remove('slds-text-color_error');
        //         textareaFormElement.classList.remove('slds-has-error');
        //     } else {
        //         // Invalid JSON format
        //         validationMessage.textContent = "Invalid JSON format!";
        //         validationMessage.classList.add('slds-text-color_error');
        //         validationMessage.classList.remove('slds-text-color_success');
        //         textareaFormElement.classList.add('slds-has-error');
        //     }
        // });

        templateSelect.addEventListener('change', function () {
            
            console.log('Template selected >>', templateList.find(template => template.id === templateSelect.value));

            $('#fail-over-construct').hide();
            const messageConstruct = document.getElementById('message-construct');
            messageConstruct.innerHTML = '';
            const templateIndexValues = templateList.find(template => template.id === templateSelect.value)?.values;

            if(templateIndexValues && Object.keys(templateIndexValues).length) {
                $('#fail-over-construct').show();
                const checkboxFailOver = document.getElementById('checkbox-fail-over');
                // uncheck
                checkboxFailOver.checked = false;
                $('#fail-over-message').hide();
            }

            const fieldListSelectOptionsHTML = '<option value="">Select Field</option>' +
            fieldSelectList.map(field => {
                return `<option value="${field.value}">${field.label}</option>`;
            });

            for(let field in templateIndexValues){
                const inputEle = document.createElement('input');
                inputEle.type = 'text';
                inputEle.id = field+'-index';
                inputEle.name = field+'-index';
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
                sldsSelectContainer.appendChild(selectEle);
                selectFormControlEle.appendChild(sldsSelectContainer);
                divCol2Ele.appendChild(selectFormControlEle);

                const divRowEle = document.createElement('div');
                divRowEle.className = 'slds-grid slds-gutters slds-m-bottom_x-small';
                divRowEle.appendChild(divCol1Ele);
                divRowEle.appendChild(divCol2Ele);

                messageConstruct.appendChild(divRowEle);
            };
        });

        failOverTemplateSelect.addEventListener('change', function () {
            console.log('Fail Over Template selected >>', templateList.find(template => template.id === templateSelect.value));

            const failOverMessageConstruct = document.getElementById('fail-over-message-construct');
            failOverMessageConstruct.innerHTML = '';

            const failOverTemplateIndexValues = templateList.find(template => template.id === failOverTemplateSelect.value)?.values;

            const fieldListSelectOptionsHTML = '<option value="">Select Field</option>' +
            fieldSelectList.map(field => {
                return `<option value="${field.value}">${field.label}</option>`;
            });

            for(let field in failOverTemplateIndexValues){
                const inputEle = document.createElement('input');
                inputEle.type = 'text';
                inputEle.id = field+'-index';
                inputEle.name = field+'-index';
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
                sldsSelectContainer.appendChild(selectEle);
                selectFormControlEle.appendChild(sldsSelectContainer);
                divCol2Ele.appendChild(selectFormControlEle);

                const divRowEle = document.createElement('div');
                divRowEle.className = 'slds-grid slds-gutters slds-m-bottom_x-small';
                divRowEle.appendChild(divCol1Ele);
                divRowEle.appendChild(divCol2Ele);

                failOverMessageConstruct.appendChild(divRowEle);
            };
        });

    }

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', function (eventDefinitionModel) {
        if (eventDefinitionModel) {
            eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
            // console.log('Request Trigger >>>', JSON.stringify(eventDefinitionModel));
        }
    });

    async function initialize(data) {
        if (data) {
            console.log('Data >>', data);
            payload = data;
        }
        await checkToken();
        await getTemplates();

        initialLoad(data);
        triggerEventsAndStoreData();
    }

    /**
     * Save function is fired off upon clicking of "Done" in Marketing Cloud
     * The config.json will be updated here if there are any updates to be done via Front End UI
     */
    function save() {
        return;
        const inArguments = [];
        let attributesMapping = {};
        attributesMapping['activity_id'] = "{{Activity.Id}}";
        attributesMapping['contact_key'] = "{{Contact.Key}}";
        attributesMapping['data'] = {
            message: $('#textarea-message-input').val(),
            template_id: $('#template-id-input').val(),
            fail_over_template_id: $('#fail-over-template-id-input').val()
        };
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
            $('#textarea-message-input').val(data['arguments'].execute.inArguments[0].data.message);
            $('#template-id-input').val(data['arguments'].execute.inArguments[0].data.template_id);
            $('#fail-over-template-id-input').val(data['arguments'].execute.inArguments[0].data.fail_over_template_id);
        }
    };

    function triggerEventsAndStoreData() {
        connection.trigger('requestSchema');
        connection.on('requestedSchema', function (data) {
            requestSchemaData = data;
            console.log('requestedSchema: ',requestSchemaData);
            parseEventSchema();
        });

        connection.trigger('requestInteraction');
        connection.on('requestedInteraction', function (data) {
            requestedInteractionData = data;
            parseEventInteraction();
        });
    }


    /**
     * This function is to pull the relevant information to create the schema of the objects
     * 
     * This function pulls out the schema for additional customizations that can be used.
     * The schema is used to create the fields that are available in the select list.
     * 
     */
    function parseEventSchema() {

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

    function parseEventInteraction() {
        console.log('Interaction >>', requestedInteractionData);
    }

    async function checkToken() {
        // Display loading spinner
        $('#loading-spinner').show();
        // check token by calling API
        const response = await fetch('https://line-lon-custom-activity-866c589e48fd.herokuapp.com/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: payload?.configurationArguments?.applicationExtensionKey }),
        }).catch(error => console.error('Error:', error));

        // Hide loading spinner
        $('#loading-spinner').hide();
    }

    function validateJSONFormat(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    }

    async function getTemplates() {
        // check token by calling API
        const response = await fetch('https://line-lon-custom-activity-866c589e48fd.herokuapp.com/templates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch(error => console.error('Error:', error));
        const resBody = await response.json(); 
        console.log('Templates Response >>', resBody);

        //fortesting
        // const resBody = {
        //     "success": "true",
        //     "data": [
        //         {
        //             "id": "TestTemplate",
        //             "values": {
        //               "Name": "",
        //               "Phone": ""
        //             }
        //         },
        //         {
        //             "id": "TestTemplate2",
        //             "values": {
        //               "Name": "",
        //               "Phone": ""
        //             }
        //           }
        //     ]
        // };

        if (resBody.success) {
            templateList = resBody.data;
            const templateSelect = document.getElementById('template-select');
            const failOverTemplateSelect = document.getElementById('fail-over-template-select');
            
            templateSelect.innerHTML = failOverTemplateSelect.innerHTML = `<option value="">Select Template</option>` +
            templateList.map(template => {
                return `<option value="${template.id}">${template.id}</option>`;
            });
        }
    }
});

function checkFailOverMessage() {
    const checkboxFailOver = document.getElementById('checkbox-fail-over');
    if(checkboxFailOver.checked){
        $('#fail-over-message').show();
    }else{
        $('#fail-over-message').hide();
    }
}