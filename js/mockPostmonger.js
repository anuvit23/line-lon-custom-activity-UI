// mockPostmonger.js

window.MockSession = class {
    constructor() {
        // Initialize your mock session here
        this.events = {};
    }

    on(eventName, callback) {
        let ignoreEvents = ['clickedNext'];
        if (!ignoreEvents.includes(eventName)) {
            let mockData = {};

            switch (eventName) {
                case 'initActivity':
                    // Initial payload when the activity is loaded
                    mockData = {
                        arguments: {
                            execute: {
                                inArguments: [
                                    {
                                        "data": {
                                            "contactid": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Contact Id"}}',
                                            "policyno": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Policy No"}}',
                                            "insuredname": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Insured Name"}}',
                                            "premium": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Premium"}}',
                                            "premiumdate": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Premium Date"}}',
                                            "premiumlink": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Premium Link"}}',
                                            "premiumbarcodelink": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Premium Barcode Link"}}',
                                            "mobileno": '{{Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408."Mobile No"}}'
                                        },
                                        "messageRequest": {
                                            "templateCd": "LONPRBeforeBill001",
                                            "type": "LON",
                                            "recipient": {
                                                "mobileNo": "mobileno",
                                            },
                                            "parameterMap": {
                                                "policyNo": "policyno",
                                                "insuredName": "insuredname",
                                                "premium": "premium",
                                                "premiumDate": "premiumdate",
                                                "premiumLink": "premiumlink",
                                                "premiumBarcodeLink": "premiumbarcodelink"
                                            }
                                        },
                                        "failOverRequest": {
                                            "templateCd": "SMSPRBeforeBill002",
                                            "type": "SMS",
                                            "checked": true,
                                            "recipient": {
                                                "mobileNo": "mobileno",
                                            },
                                            "parameterMap": {
                                                "policyNo": "policyno",
                                                "insuredName": "insuredname",
                                                "premium": "premium",
                                                "premiumDate": "premiumdate",
                                                "premiumLink": "premiumlink",
                                                "premiumBarcodeLink": "premiumbarcodelink"
                                            }
                                        },
                                        "testSend": {
                                            "phone": "1234",
                                            "lineAccount": "test"
                                        }
                                    }
                                ]
                            }
                        },
                        configurationArguments: {
                            applicationExtensionKey: "test"
                        }
                    };
                    break;

                case 'requestedTriggerEventDefinition':
                    // Schema of the entry event
                    mockData = {
                        eventDefinitionKey: 'ContactAttributeUpdated',
                        dataExtensionId: '611ae355-d723-ef11-ba68-f40343ce89d8',
                        // ... other event definition details ...
                    };
                    break;

                case 'requestedSchema':
                    // Schema of the target data extension
                    mockData = {
                        
                        schema: [
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Contact Id",
                                "name": "Contact Id",
                                "type": "Text",
                                "length": 50,
                                "default": null,
                                "isNullable": null,
                                "isPrimaryKey": true
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Policy No",
                                "name": "Policy No",
                                "type": "Text",
                                "length": 50,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Insured Name",
                                "name": "Insured Name",
                                "type": "Text",
                                "length": 50,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Premium",
                                "name": "Premium",
                                "type": "Decimal",
                                "length": 18,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Premium Date",
                                "name": "Premium Date",
                                "type": "Date",
                                "length": null,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Premium Link",
                                "name": "Premium Link",
                                "type": "Text",
                                "length": 250,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Premium Barcode Link",
                                "name": "Premium Barcode Link",
                                "type": "Text",
                                "length": 250,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-c91c33bc-a7e3-7e2c-5ef8-c386768fb408.Mobile No",
                                "name": "Mobile No",
                                "type": "Phone",
                                "length": 50,
                                "default": null,
                                "isNullable": true,
                                "isPrimaryKey": null
                            }
                        ]
                    };
                    break;

                case 'requestedInteraction':
                    // Data from the journey entry event
                    mockData = {
                        key: 'ContactAttributeUpdated',
                        details: {
                            FirstName: 'John',
                            LastName: 'Doe',
                            // ... other interaction data ...
                        }
                    };
                    break;

                // Add more cases for other events if needed (e.g., requestedTokens, requestedEndpoints)
            }

            // Trigger the callback with the mock data
            setTimeout(() => callback(mockData), 100); // Simulate a short delay
        }

    }

    trigger(event, data) {
        if (this.events[event]) {
            this.events[event](data);
        }
    }
};

window.MockPostmonger = class {
    constructor() {
        this.events = {};
        this.Session = window.MockSession;
    }
}