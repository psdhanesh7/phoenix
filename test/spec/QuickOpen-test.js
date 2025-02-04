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

/*global describe, it, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs */
/*unittests: QuickOpen*/

define(function (require, exports, module) {


    var Commands              = require("command/Commands"),
        KeyEvent              = require("utils/KeyEvent"),
        SpecRunnerUtils       = require("spec/SpecRunnerUtils");

    describe("QuickOpen", function () {
        this.category = "integration";

        var testPath = SpecRunnerUtils.getTestPath("/spec/QuickOpen-test-files");
        var brackets, testWindow, test$, executeCommand, EditorManager, DocumentManager;

        beforeEach(function () {

            runs(function () {
                SpecRunnerUtils.createTestWindowAndRun(this, function (other) {
                    testWindow = other;
                    brackets = testWindow.brackets;
                    test$ = testWindow.$;
                    executeCommand = testWindow.executeCommand;
                    EditorManager = brackets.test.EditorManager;
                    DocumentManager = brackets.test.DocumentManager;
                });
            });
        });

        afterEach(function () {
            testWindow      = null;
            brackets        = null;
            test$           = null;
            executeCommand  = null;
            EditorManager   = null;
            DocumentManager = null;
            SpecRunnerUtils.closeTestWindow();
        });

        function getSearchBar() {
            return test$(".modal-bar");
        }
        function getSearchField() {
            return test$(".modal-bar input[type='text']");
        }

        function expectSearchBarOpen() {
            expect(getSearchBar()[0]).toBeDefined();
        }

        function enterSearchText(str, timeoutLength) {
            timeoutLength = timeoutLength || 10;

            expectSearchBarOpen();

            testWindow.setTimeout(function () {
                getSearchField().val(str);
                getSearchField().trigger("input");
            }, timeoutLength);
        }

        function pressEnter() {
            expectSearchBarOpen();

            // Using keyup here because of inside knowledge of how the events are processed
            // on the QuickOpen input.
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_RETURN, "keydown", getSearchField()[0]);
        }

        /**
         * Creates a parameterized quick open test.
         * @param {string} quickOpenQuery The search query to execute after the NAVIGATE_QUICK_OPEN command.
         * @param {?string} gotoLineQuery The search query to execute after the NAVIGATE_GOTO_LINE command.
         * @param {string} file The name of the file that should be opened.
         * @param {number} line The line (1-based) where the cursor should be at the end of the operations.
         * @param {number} col The column (1-based) where the cursor should be at the end of the operations.
         * @return {function()} The configured test function.
         */
        function getQuickOpenTest(quickOpenQuery, gotoLineQuery, file, line, col) {
            return function () {
                var editor,
                    $scroller;

                SpecRunnerUtils.loadProjectInTestWindow(testPath);

                runs(function () {
                    var promise = SpecRunnerUtils.openProjectFiles([]);
                    waitsForDone(promise, "open project files");
                });

                runs(function () {
                    // Test quick open using a partial file name
                    executeCommand(Commands.NAVIGATE_QUICK_OPEN);

                    // need to set the timeout length here to ensure that it has a chance to load the file
                    // list.
                    enterSearchText(quickOpenQuery, 100);
                });

                waitsFor(function () {
                    return getSearchField().val() === quickOpenQuery;
                }, "filename entry timeout", 1000);

                runs(function () {
                    pressEnter();
                });

                waitsFor(function () {
                    editor = EditorManager.getCurrentFullEditor();
                    return editor !== null && getSearchBar().length === 0;
                }, "file opening timeout", 3000);

                runs(function () {
                    $scroller = test$(editor.getScrollerElement());

                    // Make sure we've opened the right file. It should open the longer one, because
                    // of the scoring in the StringMatch algorithm.
                    expect(DocumentManager.getCurrentDocument().file.name).toEqual(file);

                    if (gotoLineQuery) {
                        // Test go to line
                        executeCommand(Commands.NAVIGATE_GOTO_LINE);
                        enterSearchText(gotoLineQuery);
                    }
                });

                runs(function () {
                    if (gotoLineQuery) {
                        var editor = EditorManager.getCurrentFullEditor();
                        SpecRunnerUtils.resizeEditor(editor, 0, 600);

                        waitsFor(function () {
                            return getSearchField().val() === gotoLineQuery;
                        }, "goto line entry timeout", 1000);

                        runs(function () {
                            pressEnter();
                        });

                        // wait for ModalBar to close
                        waitsFor(function () {
                            return getSearchBar().length === 0;
                        }, "ModalBar close", 1000);
                    }
                });

                runs(function () {
                    // The user enters a 1-based number, but the reported position
                    // is 0 based, so we check for line-1, col-1.
                    expect(editor).toHaveCursorPosition(line - 1, col - 1);

                    // We expect the result to be scrolled roughly to the middle of the window.
                    var offset = $scroller.offset().top;
                    var editorHeight = $scroller.height();
                    var cursorPos = editor._codeMirror.cursorCoords(null, "page").bottom;

                    expect(cursorPos).toBeGreaterThan(editorHeight * 0.4 + offset);
                    expect(cursorPos).toBeLessThan(editorHeight * 0.6 + offset);
                });
            };
        }

        it("can open a file and jump to a line, centering that line on the screen",
            getQuickOpenTest("lines", ":50", "lotsOfLines.html", 50, 1));

        it("can open a file and jump to a line and column, centering that line on the screen",
            getQuickOpenTest("lines", ":50,20", "lotsOfLines.html", 50, 20));

        it("can directly open a file in a given line and column, centering that line on the screen",
            getQuickOpenTest("lines:150,20", null, "lotsOfLines.html", 150, 20));
    });
});
