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
                                            "name": "{{Event.DEAudience-xx.\"name\"}}",
                                            "email": "{{Event.DEAudience-xx.\"email\"}}",
                                            "mobile": "{{Event.DEAudience-xx.\"mobile\"}}",
                                            "policyno": "{{Event.DEAudience-xx.\"policyno\"}}"
                                        },
                                        "messageRequest": {
                                            "templateCd": "LONPRBeforeBill001",
                                            "parameterMap": {
                                                "mobileNo": "mobile",
                                            }
                                        },
                                        "failOverRequest": {
                                            "templateCd": "SMSPRBeforeBill002",
                                            "checked": true,
                                            "parameterMap": {
                                                "mobileNo": "mobile",
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
                        dataExtensionId: 'DATA_EXTENSION_ID',
                        // ... other event definition details ...
                    };
                    break;

                case 'requestedSchema':
                    // Schema of the target data extension
                    mockData = {
                        schema: [
                            {
                                "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Name",
                                "name": "Name",
                                "type": "Text",
                                "length": 50,
                                "default": null,
                                "isNullable": null,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Mobile",
                                "name": "Mobile",
                                "type": "Text",
                                "length": 50,
                                "default": null,
                                "isNullable": null,
                                "isPrimaryKey": null
                            },
                            {
                                "key": "Event.DEAudience-d0520bf9-3185-7a72-5b31-2af2245c61a9.Birth Date",
                                "name": "Birth Date",
                                "type": "Date",
                                "length": null,
                                "default": null,
                                "isNullable": null,
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