import ts = require("typescript");

function isJsxOpeningLike(node: ts.Node): node is ts.JsxOpeningLikeElement {
    return node.kind === ts.SyntaxKind.JsxOpeningElement || node.kind === ts.SyntaxKind.JsxSelfClosingElement
}

function isDefineMessages(el, tagName) {
    return el.kind === ts.SyntaxKind.VariableDeclaration && el.initializer && el.initializer.expression && el.initializer.expression.text === tagName;
}

function findProps(node) {
    var res = [];
    find(node);
    function find(node) {
        if (!node) {
            return undefined;
        }
        if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            node.properties.forEach(p => {
                var props = {};
                var prop = {};
                if (p.initializer.properties) {
                    p.initializer.properties.forEach(ip => {
                        prop[ip.name.text] = ip.initializer.text;
                    });
                    res.push(prop);
                }
            });
        }
        return ts.forEachChild(node, find);
    }

    return res;
}

function findFirstJsxOpeningLikeElementWithName(node, tagName: string, dm?: boolean) {
    var res = [];
    find(node);

    function find(node) {
        if (!node) {
            return undefined;
        }
        if (dm && node.getNamedDeclarations) {
            var nd = node.getNamedDeclarations();
            for (var key in nd) {
                var element = nd[key];
                element.forEach(el => {
                    if (isDefineMessages(el, tagName)) {
                        if (el.initializer.kind === ts.SyntaxKind.CallExpression && el.initializer.arguments.length) {
                            var nodeProps = el.initializer.arguments[0];
                            var props = findProps(nodeProps);
                            res = res.concat(props);
                        }
                    }
                });
            }
        } else {
            // Is this a JsxElement with an identifier name?
            if (isJsxOpeningLike(node) && node.tagName.kind === ts.SyntaxKind.Identifier) {
                // Does the tag name match what we're looking for?
                const childTagName = node.tagName as any;
                if (childTagName.text === tagName) {
                    res.push(node);
                }
            }
        }

        return ts.forEachChild(node, find);
    }

    return res;
}
/**
 * Parse tsx files
 * 
 * @export
 * @param {any} contents
 * @returns {array}
 */
function main(contents) {
    var sourceFile = ts.createSourceFile('file.ts', contents, ts.ScriptTarget.ES2015, /*setParentNodes */ false, ts.ScriptKind.TSX);

    var elements = findFirstJsxOpeningLikeElementWithName(sourceFile, 'FormattedMessage');
    var dm = findFirstJsxOpeningLikeElementWithName(sourceFile, 'defineMessages', true);

    // if (!elements.length) {
    //   console.log('No element found!')
    // }

    var res = elements.map(element => {
        var msg = {}
        element.attributes.forEach(function (attr) { return attr.name && 
            (attr.initializer.text  && (msg[attr.name.text] = attr.initializer.text)) || 
            ((msg[attr.name.text] = attr.initializer.expression.text)); });
        return msg;
    });

    return res.concat(dm);
}

export default main