"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("byots");
function isDefineMessages(el, tagName) {
    return (ts.isVariableDeclaration(el) &&
        el.initializer &&
        ts.isCallExpression(el.initializer) &&
        el.initializer.expression &&
        ts.isIdentifier(el.initializer.expression) &&
        el.initializer.expression.text === tagName);
}
function emptyObject(obj) {
    for (var x in obj) {
        return false;
    }
    return true;
}
function findProps(node) {
    var res = [];
    find(node);
    function find(node) {
        if (!node) {
            return undefined;
        }
        if (ts.isObjectLiteralExpression(node)) {
            node.properties.forEach(function (p) {
                var prop = {};
                if (ts.isPropertyAssignment(p) &&
                    ts.isObjectLiteralExpression(p.initializer) &&
                    p.initializer.properties) {
                    p.initializer.properties.forEach(function (ip) {
                        if (ts.isIdentifier(ip.name)) {
                            var name_1 = ip.name.text;
                            if (ts.isPropertyAssignment(ip) && ts.isStringLiteral(ip.initializer)) {
                                prop[name_1] = ip.initializer.text;
                            }
                        }
                    });
                    res.push(prop);
                }
            });
        }
        return ts.forEachChild(node, find);
    }
    return res;
}
function findFirstJsxOpeningLikeElementWithName(node, tagName, dm) {
    var res = [];
    find(node);
    function find(node) {
        if (!node) {
            return undefined;
        }
        if (dm && ts.isSourceFile(node)) {
            var nd = node.getNamedDeclarations();
            nd.forEach(function (element, key) {
                element.forEach(function (el) {
                    if (isDefineMessages(el, tagName)) {
                        if (ts.isCallExpression(el.initializer) &&
                            el.initializer.arguments.length) {
                            var nodeProps = el.initializer.arguments[0];
                            var props = findProps(nodeProps);
                            res = res.concat(props);
                        }
                    }
                });
            });
        }
        else {
            if (ts.isJsxOpeningLikeElement(node) &&
                ts.isIdentifier(node.tagName)) {
                var childTagName = node.tagName;
                if (childTagName.text === tagName) {
                    res.push(node);
                }
            }
        }
        return ts.forEachChild(node, find);
    }
    return res;
}
function main(contents) {
    var sourceFile = ts.createSourceFile("file.ts", contents, ts.ScriptTarget.ES2015, false, ts.ScriptKind.TSX);
    var elements = findFirstJsxOpeningLikeElementWithName(sourceFile, "FormattedMessage");
    var dm = findFirstJsxOpeningLikeElementWithName(sourceFile, "defineMessages", true);
    var res = elements
        .map(function (element) {
        var msg = {};
        debugger;
        element.attributes &&
            element.attributes.properties.forEach(function (attr) {
                if (!attr.name || !attr.initializer)
                    return;
                msg[attr.name.text] =
                    attr.initializer.text || attr.initializer.expression.text;
            });
        return msg;
    })
        .filter(function (r) { return !emptyObject(r); });
    return res.concat(dm);
}
exports.default = main;
//# sourceMappingURL=index.js.map