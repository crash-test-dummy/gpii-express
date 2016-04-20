/*

    An abstract grade for "request handler" modules, which respond to individual requests sent to `requestAware` or
    `contentAware` middleware.  See the documentation for more details:

    https://github.com/GPII/gpii-express/blob/master/docs/handler.md

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.express.handler");

// TODO:  Convert this to use JSON Schema validation when available: https://issues.gpii.net/browse/CTR-161
gpii.express.handler.checkRequirements = function (that) {
    if (!that.options.request) {
        fluid.fail("Cannot instantiate a 'handler' component without a request object...");
    }

    if (!that.options.response) {
        fluid.fail("Cannot instantiate a 'handler' component without a response object...");
    }
};

gpii.express.handler.setTimeout = function (that) {
    that.timeout = setTimeout(that.sendTimeoutResponse, that.options.timeout);
};

// When we are destroyed, we need to clear our timeout to avoid trying to perform an action on a destroyed component.
gpii.express.handler.clearTimeout = function (that) {
    if (that.timeout) {
        clearTimeout(that.timeout);
    }
};

gpii.express.handler.sendTimeoutResponse = function (that) {
    that.sendResponse("500", { ok: false, message: "Request aware component timed out before it could respond sensibly." });
};

// Convenience function (with accompanying invoker) to ensure that the `afterResponseSent` event is fired.
gpii.express.handler.sendResponse = function (that, response, statusCode, body) {
    if (!response) {
        fluid.fail("Cannot send response, I have no response object to work with...");
    }

    response.status(statusCode).send(body);
    that.events.afterResponseSent.fire(that);
};

fluid.defaults("gpii.express.handler", {
    gradeNames: ["fluid.component"],
    timeout:    5000, // All operations must be completed in `options.timeout` milliseconds, or we will send a timeout response and destroy ourselves.
    events: {
        afterResponseSent: null
    },
    mergePolicy: {
        "request":  "nomerge",
        "response": "nomerge"
    },
    request:  "{arguments}.1",
    response: "{arguments}.2",
    members: {
        timeout:  null
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.express.handler.checkRequirements",
            args:     ["{that}"]
        },
        "onCreate.setTimeout": {
            funcName: "gpii.express.handler.setTimeout",
            args:     ["{that}"]
        },
        "onCreate.handleRequest": {
            func: "{that}.handleRequest"
        },
        "afterResponseSent.destroy": {
            func: "{that}.destroy"
        },
        "onDestroy.clearTimeout": {
            funcName: "gpii.express.handler.clearTimeout",
            args:     ["{that}"]
        }
    },
    invokers: {
        sendResponse: {
            funcName: "gpii.express.handler.sendResponse",
            args:     ["{that}", "{that}.options.response", "{arguments}.0", "{arguments}.1"] // statusCode, body
        },
        sendTimeoutResponse: {
            funcName: "gpii.express.handler.sendTimeoutResponse",
            args:     ["{that}"]
        },
        handleRequest: {
            funcName: "fluid.notImplemented"
        }
    }
});

// The base grade for things like the "request aware" and "content aware" grades that dispatch individual requests to 
// a `gpii.express.handler`.
fluid.defaults("gpii.express.handlerDispatcher", {
    gradeNames: ["fluid.component"],
    timeout: 5000, // The default timeout we will pass to whatever grade we instantiate.
    events: {
        onRequest: null
    },
    distributeOptions: [{
        source: "{that}.options.timeout",
        target: "{that > gpii.express.handler}.options.timeout"
    }],
    dynamicComponents: {
        requestHandler: {
            createOnEvent: "onRequest",
            type:          "gpii.express.handler",
            // TODO:  Update this and test once https://issues.fluidproject.org/browse/FLUID-5893 is resolved
            // options:       "{arguments}.0"
            options:       {
                gradeNames: "{arguments}.0.gradeNames"
            }
        }
    }
});
