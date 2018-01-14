import ts = require("typescript");

function isMethodCall(el: ts.Declaration, methodName: string): el is ts.VariableDeclaration {
  return (
    ts.isVariableDeclaration(el) &&
    el.initializer &&
    ts.isCallExpression(el.initializer) &&
    el.initializer.expression &&
    ts.isIdentifier(el.initializer.expression) &&
    el.initializer.expression.text === methodName
  );
}

// Should be pretty fast: https://stackoverflow.com/a/34491287/14379
function emptyObject(obj: any) {
  for (var x in obj) {
    return false;
  }
  return true;
}

interface LooseObject {
  [key: string]: any
}

function findProps(node: ts.Node, tagName: string): LooseObject[] {
  var res: LooseObject[] = [];
  find(node);
  function find(node: ts.Node): LooseObject[] {
    if (!node) {
      return undefined;
    }
    if (ts.isObjectLiteralExpression(node)) {
        node.properties.forEach(p => {
          var prop: LooseObject = {};
          if (
            ts.isPropertyAssignment(p) &&
            ts.isObjectLiteralExpression(p.initializer) &&
            p.initializer.properties
          ) {
            p.initializer.properties.forEach(ip => {
              if (ts.isIdentifier(ip.name)) {
                let name = ip.name.text
                if (ts.isPropertyAssignment(ip) && ts.isStringLiteral(ip.initializer)) {
                  prop[name] = ip.initializer.text;
                }
              }
            });
            res.push(prop);
          }
        });

       if (tagName === "formatMessage") {
          var prop: LooseObject = {};
          node.properties.forEach(p => {
            if (
              ts.isPropertyAssignment(p) &&
              (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
              ts.isStringLiteral(p.initializer)
            ) {
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

function forAllVarDecls(node: ts.Node, cb: (el: ts.VariableDeclaration) => void) {
  if (ts.isVariableDeclaration(node)) {
    cb(node)
  } else {
    ts.forEachChild(node, n => forAllVarDecls(n, cb))
  }
}

function findFirstJsxOpeningLikeElementWithName(
  node: ts.SourceFile,
  tagName: string,
  findMethodCall?: boolean
) {
  var res: LooseObject[] = [];
  find(node);

  function find(node: ts.Node | ts.SourceFile): undefined {
    if (!node) {
      return undefined;
    }
    if (findMethodCall && ts.isSourceFile(node)) {
      // getNamedDeclarations is not currently public
      forAllVarDecls(node, (el: ts.Declaration) => {
        if (isMethodCall(el, tagName)) {
          if (
            ts.isCallExpression(el.initializer) &&
            el.initializer.arguments.length
          ) {
            var nodeProps = el.initializer.arguments[0];
            var props = findProps(nodeProps, tagName);
            // props is an array of LooseObject
            res = res.concat(props);
          }
        }
      })
    } else {
      // Is this a JsxElement with an identifier name?
      if (
        ts.isJsxOpeningLikeElement(node) &&
        ts.isIdentifier(node.tagName)
      ) {
        // Does the tag name match what we're looking for?
        const childTagName = node.tagName;
        if (childTagName.text === tagName) {
          // node is a JsxOpeningLikeElement
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
 * @param {string} contents
 * @returns {array}
 */
function main(contents: string): {}[] {
  var sourceFile = ts.createSourceFile(
    "file.ts",
    contents,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ false,
    ts.ScriptKind.TSX
  );

  var elements = findFirstJsxOpeningLikeElementWithName(
    sourceFile,
    "FormattedMessage"
  );
  var dm = findFirstJsxOpeningLikeElementWithName(
    sourceFile,
    "defineMessages",
    true
  );
  var fm = findFirstJsxOpeningLikeElementWithName(
    sourceFile,
    "formatMessage",
    true
  );

  var res = elements
    .map(element => {
      var msg: LooseObject = {};
      element.attributes &&
        element.attributes.properties.forEach((attr: LooseObject) => {
          // found nothing
          if (!attr.name || !attr.initializer) return;
          msg[attr.name.text] =
            attr.initializer.text || attr.initializer.expression.text;
        });
      return msg;
    })
    .filter(r => !emptyObject(r));

  return res.concat(dm).concat(fm);
}

export default main;
