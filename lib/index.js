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
// sets `target[key] = value`, but only if it is a legal Message key
function copyIfMessageKey(target, key, value) {
    switch (key) {
        case "defaultMessage":
        case "description":
        case "id":
            target[key] = value;
            break;
        default:
            break;
    }
}
// are the required keys of a valid Message present?
function isValidMessage(obj) {
    return "id" in obj;
}
function extractMessagesForDefineMessages(objLiteral) {
    var messages = [];
    objLiteral.properties.forEach(function (p) {
        var msg = {};
        if (ts.isPropertyAssignment(p) &&
            ts.isObjectLiteralExpression(p.initializer) &&
            p.initializer.properties) {
            p.initializer.properties.forEach(function (ip) {
                if (ip.name &&
                    (ts.isIdentifier(ip.name) || ts.isLiteralExpression(ip.name))) {
                    var name_1 = ip.name.text;
                    if (ts.isPropertyAssignment(ip) &&
                        (ts.isStringLiteral(ip.initializer) ||
                            ts.isNoSubstitutionTemplateLiteral(ip.initializer))) {
                        copyIfMessageKey(msg, name_1, ip.initializer.text);
                    }
                    // else: key/value is not a string literal/identifier
                }
            });
            isValidMessage(msg) && messages.push(msg);
        }
    });
    return messages;
}
function extractMessagesForFormatMessage(objLiteral) {
    var msg = {};
    objLiteral.properties.forEach(function (p) {
        if (ts.isPropertyAssignment(p) &&
            (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
            ts.isStringLiteral(p.initializer)) {
            copyIfMessageKey(msg, p.name.text, p.initializer.text);
        }
        // else: key/value is not a string literal/identifier
    });
    return isValidMessage(msg) ? [msg] : [];
}
function extractMessagesForNode(node, extractMessages) {
    var res = [];
    function find(n) {
        if (ts.isObjectLiteralExpression(n)) {
            res.push.apply(res, extractMessages(n));
            return undefined;
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
function main(contents, options) {
    if (options === void 0) { options = { tagNames: [] }; }
    var sourceFile = ts.createSourceFile("file.ts", contents, ts.ScriptTarget.ES2015, 
    /*setParentNodes */ false, ts.ScriptKind.TSX);
    var dm = findMethodCallsWithName(sourceFile, "defineMessages", extractMessagesForDefineMessages);
    // TODO formatMessage might not be the initializer for a VarDecl
    // eg console.log(formatMessage(...))
    var fm = findMethodCallsWithName(sourceFile, "formatMessage", extractMessagesForFormatMessage);
    var results = [];
    var tagNames = ["FormattedMessage"].concat(options.tagNames);
    tagNames.forEach(function (tagName) {
        var elements = findJsxOpeningLikeElementsWithName(sourceFile, tagName);
        // convert JsxOpeningLikeElements to Message maps
        var jsxMessages = getElementsMessages(elements);
        results.push.apply(results, jsxMessages);
    });
    return results.concat(dm).concat(fm);
}
/**
 * convert JsxOpeningLikeElements to Message maps
 * @param elements
 */
function getElementsMessages(elements) {
    return elements
        .map(function (element) {
        var msg = {};
        if (element.attributes) {
            element.attributes.properties.forEach(function (attr) {
                if (!ts.isJsxAttribute(attr) || !attr.initializer) {
                    // Either JsxSpreadAttribute, or JsxAttribute without initializer.
                    return;
                }
                var key = attr.name.text;
                var init = attr.initializer;
                var text;
                if (ts.isStringLiteral(init)) {
                    text = init.text;
                }
                else if (ts.isJsxExpression(init)) {
                    if (init.expression &&
                        (ts.isStringLiteral(init.expression) ||
                            ts.isNoSubstitutionTemplateLiteral(init.expression))) {
                        text = init.expression.text;
                    }
                    else {
                        // Either the JsxExpression has no expression (?)
                        // or a non-StringLiteral expression.
                        return;
                    }
                }
                else {
                    // Should be a StringLiteral or JsxExpression, but it's not!
                    return;
                }
                copyIfMessageKey(msg, key, text);
            });
        }
        return isValidMessage(msg) ? msg : null;
    })
        .filter(notNull);
}
function notNull(value) {
    return value !== null;
}
exports.default = main;
//# sourceMappingURL=index.js.map