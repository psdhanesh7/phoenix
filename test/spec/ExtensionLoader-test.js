/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2013 - 2021 Adobe Systems Incorporated. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

/*jslint regexp: true */
/*global describe, it, expect, spyOn, runs, waitsForDone, waitsForFail, beforeEach, afterEach */

define(function (require, exports, module) {


    // Load dependent modules
    var ExtensionLoader = require("utils/ExtensionLoader"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils");

    var testPath = SpecRunnerUtils.getTestPath("/spec/ExtensionLoader-test-files");

    describe("ExtensionLoader", function () {

        var origTimeout;

        function testLoadExtension(name, promiseState, error) {
            var promise,
                config = {
                    baseUrl: testPath + "/" + name
                },
                consoleErrors = [];

            runs(function () {
                var originalConsoleErrorFn = console.error;
                spyOn(console, "error").andCallFake(function () {
                    originalConsoleErrorFn.apply(console, arguments);

                    if (typeof arguments[0] === "string" &&
                        arguments[0].indexOf("[Extension]") === 0) {
                        consoleErrors.push(Array.prototype.join.call(arguments));
                    }
                });
                promise = ExtensionLoader.loadExtension(name, config, "main");

                if (error) {
                    waitsForFail(promise, "loadExtension", 10000);
                } else {
                    waitsForDone(promise, "loadExtension");
                }
            });

            runs(function () {
                if (error) {
                    if (typeof error === "string") {
                        expect(consoleErrors[0]).toBe(error);
                    } else {
                        expect(consoleErrors[0]).toMatch(error);
                    }
                } else {
                    expect(consoleErrors).toEqual([]);  // causes console errors to be logged in test failure message
                }

                expect(promise.state()).toBe(promiseState);
            });
        }

        beforeEach(function () {
            runs(function () {
                origTimeout = ExtensionLoader._getInitExtensionTimeout();
                ExtensionLoader._setInitExtensionTimeout(500);
            });
        });

        afterEach(function () {
            runs(function () {
                ExtensionLoader._setInitExtensionTimeout(origTimeout);
            });
        });

        it("should load a basic extension", function () {
            testLoadExtension("NoInit", "resolved");
        });

        it("should load a basic extension with sync init", function () {
            testLoadExtension("InitResolved", "resolved");
        });

        it("should load a basic extension with async init", function () {
            testLoadExtension("InitResolvedAsync", "resolved");
        });

        it("should load a basic extension that uses requirejs-config.json", function () {
            runs(function () {
                spyOn(console, "log").andCallThrough();
            });

            testLoadExtension("RequireJSConfig", "resolved");

            runs(function () {
                expect(console.log.mostRecentCall.args[0]).toBe("bar_exported");
            });
        });

        it("should log an error if an extension fails to init", function () {
            testLoadExtension("InitFail", "rejected", "[Extension] Error -- failed initExtension for InitFail");
        });

        it("should log an error with a message if an extension fails to sync init", function () {
            testLoadExtension("InitFailWithError", "rejected", "[Extension] Error -- failed initExtension for InitFailWithError: Didn't work");
        });

        it("should log an error with a message if an extension fails to async init", function () {
            testLoadExtension("InitFailWithErrorAsync", "rejected", "[Extension] Error -- failed initExtension for InitFailWithErrorAsync: Didn't work");
        });

        it("should log an error if an extension init fails with a timeout", function () {
            testLoadExtension("InitTimeout", "rejected", "[Extension] Error -- timeout during initExtension for InitTimeout");
        });

        it("should log an error if an extension init fails with a runtime error", function () {
            testLoadExtension("InitRuntimeError", "rejected", "[Extension] Error -- error thrown during initExtension for InitRuntimeError: ReferenceError: isNotDefined is not defined");
        });

        it("should log an error if an extension fails during RequireJS loading", function () {
            testLoadExtension("BadRequire", "rejected", /\[Extension\] failed to load.*BadRequire.* - Module does not exist: .*BadRequire\/notdefined\.js/);
        });

        it("should log an error if an extension uses an invalid requirejs-config.json", function () {
            testLoadExtension("BadRequireConfig", "rejected", /\[Extension\] failed to load.*BadRequireConfig.*failed to parse requirejs-config.json/);
        });

    });
});
