"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function isMethodCall(el, methodName) {
    return (ts.isVariableDeclaration(el) &&
        el.initializer &&
        ts.isCallExpression(el.initializer) &&
        el.initializer.expression &&
        ts.isIdentifier(el.initializer.expression) &&
        el.initializer.expression.text === methodName);
}
function emptyObject(obj) {
    for (var x in obj) {
        return false;
    }
    return true;
}
function findProps(node, tagName) {
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
            if (tagName === "formatMessage") {
                var prop = {};
                node.properties.forEach(function (p) {
                    if (ts.isPropertyAssignment(p) &&
                        (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
                        ts.isStringLiteral(p.initializer)) {
                        prop[p.name.text] = p.initializer.text;
                    }
                });
                res.push(prop);
            }
        }
        return ts.forEachChild(node, find);
    }
    return res;
}
function forAllVarDecls(node, cb) {
    if (ts.isVariableDeclaration(node)) {
        cb(node);
    }
    else {
        ts.forEachChild(node, function (n) { return forAllVarDecls(n, cb); });
    }
}
function findFirstJsxOpeningLikeElementWithName(node, tagName, findMethodCall) {
    var res = [];
    find(node);
    function find(node) {
        if (!node) {
            return undefined;
        }
        if (findMethodCall && ts.isSourceFile(node)) {
            forAllVarDecls(node, function (el) {
                if (isMethodCall(el, tagName)) {
                    if (ts.isCallExpression(el.initializer) &&
                        el.initializer.arguments.length) {
                        var nodeProps = el.initializer.arguments[0];
                        var props = findProps(nodeProps, tagName);
                        res = res.concat(props);
                    }
                }
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
    var fm = findFirstJsxOpeningLikeElementWithName(sourceFile, "formatMessage", true);
    var res = elements
        .map(function (element) {
        var msg = {};
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
    return res.concat(dm).concat(fm);
}
exports.default = main;
//# sourceMappingURL=index.js.map