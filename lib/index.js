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
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
function extractMessagesForDefineMessages(objLiteral) {
    var messages = [];
    objLiteral.properties.forEach(function (p) {
        var message = {};
        if (ts.isPropertyAssignment(p) &&
            ts.isObjectLiteralExpression(p.initializer) &&
            p.initializer.properties) {
            p.initializer.properties.forEach(function (ip) {
                if (ts.isIdentifier(ip.name) || ts.isLiteralExpression(ip.name)) {
                    var name_1 = ip.name.text;
                    if (ts.isPropertyAssignment(ip) && ts.isStringLiteral(ip.initializer)) {
                        message[name_1] = ip.initializer.text;
                    }
                }
            });
            messages.push(message);
        }
    });
    return messages;
}
function extractMessagesForFormatMessage(objLiteral) {
    var message = {};
    objLiteral.properties.forEach(function (p) {
        if (ts.isPropertyAssignment(p) &&
            (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
            ts.isStringLiteral(p.initializer)) {
            message[p.name.text] = p.initializer.text;
        }
    });
    return [message];
}
function extractMessagesForNode(node, extractMessages) {
    var res = [];
    function find(n) {
        if (ts.isObjectLiteralExpression(n)) {
            res.push.apply(res, extractMessages(n));
        }
        else {
            return ts.forEachChild(n, find);
        }
    }
    find(node);
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
function findJsxOpeningLikeElementsWithName(node, tagName) {
    var messages = [];
    function findJsxElement(n) {
        if (ts.isJsxOpeningLikeElement(n) &&
            ts.isIdentifier(n.tagName)) {
            var childTagName = n.tagName;
            if (childTagName.text === tagName) {
                messages.push(n);
            }
        }
        return ts.forEachChild(n, findJsxElement);
    }
    findJsxElement(node);
    return messages;
}
function findMethodCallsWithName(sourceFile, methodName, extractMessages) {
    var messages = [];
    forAllVarDecls(sourceFile, function (decl) {
        if (isMethodCall(decl, methodName)) {
            if (ts.isCallExpression(decl.initializer) &&
                decl.initializer.arguments.length) {
                var nodeProps = decl.initializer.arguments[0];
                var declMessages = extractMessagesForNode(nodeProps, extractMessages);
                messages = messages.concat(declMessages);
            }
        }
    });
    return messages;
}
function main(contents) {
    var sourceFile = ts.createSourceFile("file.ts", contents, ts.ScriptTarget.ES2015, false, ts.ScriptKind.TSX);
    var elements = findJsxOpeningLikeElementsWithName(sourceFile, "FormattedMessage");
    var dm = findMethodCallsWithName(sourceFile, "defineMessages", extractMessagesForDefineMessages);
    var fm = findMethodCallsWithName(sourceFile, "formatMessage", extractMessagesForFormatMessage);
    var jsxMessages = elements
        .map(function (element) {
        var msg = {};
        element.attributes &&
            element.attributes.properties.forEach(function (attr) {
                var a = attr;
                if (!a.name || !a.initializer) {
                    return;
                }
                msg[a.name.text] =
                    a.initializer.text || a.initializer.expression.text;
            });
        return msg;
    })
        .filter(function (r) { return !emptyObject(r); });
    return jsxMessages.concat(dm).concat(fm);
}
exports.default = main;
//# sourceMappingURL=index.js.map