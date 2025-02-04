/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, expect, jasmine */
/*unittests: FileTreeView*/

define(function (require, exports, module) {


    var FileTreeView      = require("project/FileTreeView"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        Preact            = require("thirdparty/preact"),
        Immutable         = require("thirdparty/immutable"),
        PreactTestUtils   = require("thirdparty/preact-test-utils"),
        _                 = require("thirdparty/lodash");

    // Preact Test Utils doesn't have findRenderedDOMComponentWithTag method
    // So create it
    var findRenderedDOMComponentWithTag = function(root, tagName) {
        var nodes = [];
        if (root.base.tagName.toUpperCase() === tagName.toUpperCase()){
            nodes.push(root.base);
        } else {
            for (var i = 0; i < root.base.childNodes.length; ++i) {
                if (root.base.childNodes[i].tagName === tagName.toUpperCase()) {
                    nodes.push(root.base.childNodes[i]);
                }
            }
        }
        if (nodes.length !== 1) {
            throw new Error('Did not find exactly one match for tag:' + tagName);
        }
        return nodes[0];
    };

    describe("FileTreeView", function () {

        describe("_fileNode", function () {
            it("should create a component with the right information", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map()
                }));
                var a = findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.children[0].textContent).toBe("");
                expect(a.children[1].textContent).toBe(" ");
                expect(a.children[2].textContent).toBe("afile");
                expect(a.children[3].textContent).toBe(".js");
            });

            it("should call icon extensions to replace the default icon", function () {
                var extensionCalls = 0,
                    rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                expect(data.name).toBe("afile.js");
                                expect(data.isFile).toBe(true);
                                expect(data.fullPath).toBe("/foo/afile.js");
                                return Preact.DOM.ins({}, "ICON");
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var a = findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.children[0].textContent).toBe("");
                expect(a.children[1].textContent).toBe("ICON");
                expect(a.children[2].textContent).toBe("afile");
                expect(a.children[3].textContent).toBe(".js");
            });

            it("should allow icon extensions to return a string for the icon", function () {
                var extensionCalls = 0,
                    rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                return "<ins>ICON</ins>";
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var a = findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.children[0].textContent).toBe("");
                expect(a.children[2].textContent).toBe("afile");
                expect(a.children[3].textContent).toBe(".js");

                var $a = $(Preact.findDOMNode(a)),
                    $ins = $a.find("ins");

                expect($ins.text()).toBe("ICON");
            });

            it("should set context on a node by right click", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/"
                }));
                var node = Preact.findDOMNode(rendered);
                PreactTestUtils.Simulate.mouseDown(node, {
                    button: 2
                });
                expect(actions.setContext).toHaveBeenCalledWith("/foo/afile.js");
            });

            it("should set context on a node by control click on Mac", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/",
                    platform: "mac"
                }));
                var node = Preact.findDOMNode(rendered);
                PreactTestUtils.Simulate.mouseDown(node, {
                    button: 0,
                    ctrlKey: true
                });
                expect(actions.setContext).toHaveBeenCalledWith("/foo/afile.js");
            });

            it("should not set context on a node by control click on Windows", function () {
                var actions = jasmine.createSpyObj("actions", ["setContext"]);
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map(),
                    actions: actions,
                    parentPath: "/foo/",
                    platform: "win"
                }));
                var node = Preact.findDOMNode(rendered);
                PreactTestUtils.Simulate.mouseDown(node, {
                    button: 0,
                    ctrlKey: true
                });
                expect(actions.setContext).not.toHaveBeenCalled();
            });

            it("should allow icon extensions to return a jQuery object for the icon", function () {
                var extensionCalls = 0,
                    rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                extensionCalls++;
                                return $("<ins/>").text("ICON");
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var a = findRenderedDOMComponentWithTag(rendered, "a");
                expect(a.children[0].textContent).toBe("");
                expect(a.children[2].textContent).toBe("afile");
                expect(a.children[3].textContent).toBe(".js");

                var $a = $(a),
                    $ins = $a.find("ins");

                expect($ins.text()).toBe("ICON");
            });

            it("should call addClass extensions", function () {
                var extensionCalls = 0,
                    rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                        name: "afile.js",
                        entry: Immutable.Map(),
                        parentPath: "/foo/",
                        extensions: Immutable.fromJS({
                            addClass: [function (data) {
                                extensionCalls++;
                                expect(data.name).toBe("afile.js");
                                expect(data.isFile).toBe(true);
                                expect(data.fullPath).toBe("/foo/afile.js");
                                return "new";
                            }, function (data) {
                                return "classes are cool";
                            }]
                        })
                    }));

                expect(extensionCalls).toBe(1);

                var li = findRenderedDOMComponentWithTag(rendered, "li");
                expect(li.className).toBe("jstree-leaf new classes are cool");
            });

            it("should render a rename component", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode({
                    name: "afile.js",
                    entry: Immutable.Map({
                        rename: true
                    })
                }));
                var input = findRenderedDOMComponentWithTag(rendered, "input");
                expect(input.value).toBe("afile.js");
            });

            it("should re-render as needed", function () {
                var props = {
                    name: "afile.js",
                    entry: Immutable.Map(),
                    parentPath: "/foo/",
                    extensions: Immutable.Map()
                };

                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileNode(props));

                var newProps = _.clone(props);
                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.entry = Immutable.Map({
                    selected: true
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });
        });

        describe("_sortFormattedDirectory", function () {
            it("should sort alphabetically", function () {
                var formatted = Immutable.fromJS({
                    "README.md": {},
                    "afile.js": {},
                    subdir: {
                        children: null
                    }
                });
                expect(FileTreeView._sortFormattedDirectory(formatted).toJS()).toEqual([
                    "afile.js", "README.md", "subdir"
                ]);
            });

            it("should include the extension in the sort", function () {
                var formatted = Immutable.fromJS({
                    "README.txt": {},
                    "README.md": {},
                    "README": {}
                });
                expect(FileTreeView._sortFormattedDirectory(formatted).toJS()).toEqual([
                    "README", "README.md", "README.txt"
                ]);
            });

            it("can sort by directories first", function () {
                var formatted = Immutable.fromJS({
                    "README.md": {},
                    "afile.js": {},
                    subdir: {
                        children: null
                    }
                });
                expect(FileTreeView._sortFormattedDirectory(formatted, true).toJS()).toEqual([
                    "subdir", "afile.js", "README.md"
                ]);
            });
        });

        var twoLevel = Immutable.fromJS({
            open: true,
            children: {
                subdir: {
                    open: true,
                    children: {
                        "afile.js": {}
                    }
                }
            }
        });

        describe("_directoryNode and _directoryContents", function () {
            it("should format a closed directory", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    parentPath: "/foo/",
                    entry: Immutable.fromJS({
                        children: null
                    })
                }));
                var dirLI = Preact.findDOMNode(rendered),
                    dirA = $(dirLI).find("a")[0];

                expect(dirLI.children[1].textContent).toBe(" thedir");
                expect(rendered.myPath()).toBe("/foo/thedir/");
            });

            it("should rerender as needed", function () {
                var props = {
                    name: "thedir",
                    parentPath: "/foo/",
                    entry: Immutable.fromJS({
                        children: null
                    }),
                    extensions: Immutable.Map(),
                    sortDirectoriesFirst: false
                };

                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode(props));

                var newProps = _.clone(props);

                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.entry = Immutable.fromJS({
                    children: []
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });

            it("should call extensions for directories", function () {
                var extensionCalled = false,
                    rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                        name: "thedir",
                        parentPath: "/foo/",
                        entry: Immutable.fromJS({
                            children: null
                        }),
                        extensions: Immutable.fromJS({
                            icons: [function (data) {
                                return Preact.DOM.ins({}, "ICON");
                            }],
                            addClass: [function (data) {
                                extensionCalled = true;
                                expect(data.name).toBe("thedir");
                                expect(data.isFile).toBe(false);
                                expect(data.fullPath).toBe("/foo/thedir/");
                                return "new";
                            }, function (data) {
                                return "classes are cool";
                            }]
                        })
                    }));

                expect(extensionCalled).toBe(true);

                var dirLI = Preact.findDOMNode(rendered),
                    dirA = $(dirLI).find("a")[0];

                expect(dirLI.className).toBe("jstree-closed new classes are cool");
                expect(dirA.children[0].textContent).toBe("");
                expect(dirA.children[1].textContent).toBe("ICON");
            });

            it("should allow renaming a closed directory", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    entry: Immutable.fromJS({
                        children: null,
                        rename: true
                    })
                }));
                var input = findRenderedDOMComponentWithTag(rendered, "input");
                expect(input.value).toBe("thedir");
            });

            it("should be able to list files", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryContents({
                    contents: Immutable.fromJS({
                        "afile.js": {}
                    })
                }));
                var fileLI = Preact.findDOMNode(rendered),
                    fileA = $(fileLI).find("a")[0];
                expect(fileA.children[2].textContent).toBe("afile");
            });

            it("should be able to list closed directories", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                    name: "thedir",
                    entry: Immutable.fromJS({
                        open: true,
                        children: {
                            "subdir": {
                                children: null
                            }
                        }
                    })
                }));

                var subdirLI = Preact.findDOMNode(rendered),
                    subdirA = $(subdirLI).find(".jstree-closed > a")[0];
                expect(subdirA.children[2].textContent).toBe("subdir");
            });

            it("should be able to list open subdirectories", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                    name: "twoLevel",
                    entry: twoLevel
                }));
                var dirLI = Preact.findDOMNode(rendered);

                var subdirLI = $(dirLI).find(".jstree-open"),
                    aTags = subdirLI.find("a");

                expect(aTags.length).toBe(2);
                expect(aTags[0].children[2].textContent).toBe("subdir");
                expect(aTags[1].children[2].textContent).toBe("afile");
            });

            it("should sort directory contents according to the flag", function () {
                var directory = Immutable.fromJS({
                    children: {
                        "afile.js": {},
                        "subdir": {
                            children: {}
                        }
                    },
                    open: true
                });

                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryNode({
                    name: "hasDirs",
                    entry: directory,
                    sortDirectoriesFirst: true
                }));
                var html = Preact.findDOMNode(rendered).outerHTML;
                expect(html.indexOf("subdir")).toBeLessThan(html.indexOf("afile"));
            });

            it("should rerender contents as needed", function () {
                var props = {
                    parentPath: "/foo/",
                    contents: Immutable.Map(),
                    sortDirectoriesFirst: false,
                    extensions: Immutable.Map()
                };

                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._directoryContents(props));

                var newProps = _.clone(props);

                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.contents = Immutable.fromJS({
                    somefile: {}
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });
        });

        describe("_fileTreeView", function () {
            var selectionViewInfo = new Immutable.Map({
                hasSelection: true,
                width: 100,
                hasContext: false,
                scrollTop: 0,
                scrollLeft: 0,
                offsetTop: 0
            });

            it("should render the directory", function () {
                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileTreeView({
                    projectRoot: {},
                    treeData: new Immutable.Map({
                        "subdir": twoLevel.getIn(["children", "subdir"])
                    }),
                    selectionViewInfo: selectionViewInfo,
                    sortDirectoriesFirst: false
                }));

                var rootNode = Preact.findDOMNode(rendered),
                    aTags = $(rootNode).find("a");
                expect(aTags.length).toBe(2);
                expect(aTags[0].children[2].textContent).toBe("subdir");
                expect(aTags[1].children[2].textContent).toBe("afile");
            });

            it("should rerender contents as needed", function () {
                var props = {
                    parentPath: "/foo/",
                    treeData: Immutable.Map(),
                    selectionViewInfo: selectionViewInfo,
                    sortDirectoriesFirst: false,
                    extensions: Immutable.Map()
                };

                var rendered = PreactTestUtils.renderIntoDocument(FileTreeView._fileTreeView(props));

                var newProps = _.clone(props);

                expect(rendered.shouldComponentUpdate(newProps)).toBe(false);

                newProps = _.clone(props);
                newProps.treeData = Immutable.fromJS({
                    somefile: {}
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.forceRender = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.extensions = Immutable.Map({
                    addClasses: Immutable.List()
                });
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);

                newProps = _.clone(props);
                newProps.sortDirectoriesFirst = true;
                expect(rendered.shouldComponentUpdate(newProps)).toBe(true);
            });
        });

        describe("render", function () {
            it("should render into the given element", function () {
                var el = window.document.createElement("div"),
                    viewModel = new FileTreeViewModel.FileTreeViewModel();
                viewModel._treeData = new Immutable.Map({
                    "subdir": twoLevel.getIn(["children", "subdir"])
                });
                FileTreeView.render(el, viewModel, {
                    fullPath: "/foo/"
                });
                expect($(".jstree-no-dots", el).length).toBe(1);
            });
        });
    });
});
