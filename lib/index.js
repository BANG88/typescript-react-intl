"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
function isMethodCall(el, methodName) {
    return (ts.isVariableDeclaration(el) &&
        !!el.initializer &&
        ts.isCallExpression(el.initializer) &&
        el.initializer.expression &&
        ts.isIdentifier(el.initializer.expression) &&
        el.initializer.expression.text === methodName);
}
function toMessage(obj) {
    if (obj.id && obj.defaultMessage) {
        var res = {
            defaultMessage: obj.defaultMessage,
            id: obj.id,
        };
        if (obj.description) {
            res.description = obj.description;
        }
        return res;
    }
    else {
        return null;
    }
}
function newMap() {
    return Object.create(null);
}
function extractMessagesForDefineMessages(objLiteral) {
    var messages = [];
    objLiteral.properties.forEach(function (p) {
        var map = newMap();
        if (ts.isPropertyAssignment(p) &&
            ts.isObjectLiteralExpression(p.initializer) &&
            p.initializer.properties) {
            p.initializer.properties.forEach(function (ip) {
                if (ip.name &&
                    (ts.isIdentifier(ip.name) || ts.isLiteralExpression(ip.name))) {
                    var name_1 = ip.name.text;
                    if (ts.isPropertyAssignment(ip) &&
                        ts.isStringLiteral(ip.initializer)) {
                        map[name_1] = ip.initializer.text;
                    }
                    // else: key/value is not a string literal/identifier
                }
            });
            var msg = toMessage(map);
            if (msg) {
                messages.push(msg);
            }
        }
    });
    return messages;
}
function extractMessagesForFormatMessage(objLiteral) {
    var map = newMap();
    objLiteral.properties.forEach(function (p) {
        if (ts.isPropertyAssignment(p) &&
            (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
            ts.isStringLiteral(p.initializer)) {
            map[p.name.text] = p.initializer.text;
        }
        // else: key/value is not a string literal/identifier
    });
    var msg = toMessage(map);
    if (msg) {
        return [msg];
    }
    else {
        return [];
    }
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
        // Is this a JsxElement with an identifier name?
        if (ts.isJsxOpeningLikeElement(n) && ts.isIdentifier(n.tagName)) {
            // Does the tag name match what we're looking for?
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
    // getNamedDeclarations is not currently public
    forAllVarDecls(sourceFile, function (decl) {
        if (isMethodCall(decl, methodName)) {
            if (decl.initializer &&
                ts.isCallExpression(decl.initializer) &&
                decl.initializer.arguments.length) {
                var nodeProps = decl.initializer.arguments[0];
                var declMessages = extractMessagesForNode(nodeProps, extractMessages);
                messages = messages.concat(declMessages);
            }
        }
    });
    return messages;
}
/**
 * Parse tsx files
 */
function main(contents) {
    var sourceFile = ts.createSourceFile("file.ts", contents, ts.ScriptTarget.ES2015, 
    /*setParentNodes */ false, ts.ScriptKind.TSX);
    var elements = findJsxOpeningLikeElementsWithName(sourceFile, "FormattedMessage");
    var dm = findMethodCallsWithName(sourceFile, "defineMessages", extractMessagesForDefineMessages);
    // TODO formatMessage might not be the initializer for a VarDecl
    // eg console.log(formatMessage(...))
    var fm = findMethodCallsWithName(sourceFile, "formatMessage", extractMessagesForFormatMessage);
    // convert JsxOpeningLikeElements to Message maps
    var jsxMessages = elements
        .map(function (element) {
        var msg = newMap();
        if (element.attributes) {
            element.attributes.properties.forEach(function (attr) {
                // found nothing
                // tslint:disable-next-line:no-any
                var a = attr; // TODO find correct types to avoid "any"
                if (!a.name || !a.initializer) {
                    return;
                }
                msg[a.name.text] =
                    a.initializer.text || a.initializer.expression.text;
            });
        }
        return toMessage(msg);
    })
        .filter(notNull);
    return jsxMessages.concat(dm).concat(fm);
}
function notNull(value) {
    return value !== null;
}
exports.default = main;
//# sourceMappingURL=index.js.map