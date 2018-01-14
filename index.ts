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

type MethodName = "defineMessages" | "formatMessage";

function findPropsForDefineMessages(node: ts.ObjectLiteralExpression): LooseObject[] {
  var messages: LooseObject[] = [];
  node.properties.forEach(p => {
    var message: LooseObject = {};
    if (
      ts.isPropertyAssignment(p) &&
      ts.isObjectLiteralExpression(p.initializer) &&
      p.initializer.properties
    ) {
      p.initializer.properties.forEach(ip => {
        if (ts.isIdentifier(ip.name)) {
          let name = ip.name.text
          if (ts.isPropertyAssignment(ip) && ts.isStringLiteral(ip.initializer)) {
            message[name] = ip.initializer.text;
          }
        }
      });
      messages.push(message);
    }
  });
  return messages;
}

function findPropsForFormatMessage(node: ts.ObjectLiteralExpression): LooseObject[] {
  var message: LooseObject = {};
  node.properties.forEach(p => {
    if (
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
      ts.isStringLiteral(p.initializer)
    ) {
        message[p.name.text] = p.initializer.text;
      }
    });
  return [message];
}

function findProps(node: ts.Node, methodName: MethodName): LooseObject[] {
  var res: LooseObject[] = [];
  function find(node: ts.Node): LooseObject[] {
    if (!node) {
      return undefined;
    }
    if (ts.isObjectLiteralExpression(node)) {
      if (methodName === "defineMessages") {
        res.push(...findPropsForDefineMessages(node));
      } else if (methodName === "formatMessage") {
        res.push(...findPropsForFormatMessage(node));
      } else {
        throw "unexpected methodName: " + methodName
      }
    } else {
      return ts.forEachChild(node, find);
    }
  }
  find(node);
  return res;
}

function forAllVarDecls(node: ts.Node, cb: (el: ts.VariableDeclaration) => void) {
  if (ts.isVariableDeclaration(node)) {
    cb(node)
  } else {
    ts.forEachChild(node, n => forAllVarDecls(n, cb))
  }
}

function findJsxOpeningLikeElementsWithName(
  node: ts.SourceFile,
  tagName: string
) {
  let res: LooseObject[] = [];
  function findJsxElement(node: ts.Node): undefined {
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
    return ts.forEachChild(node, findJsxElement);
  }
  findJsxElement(node);
  return res;
}

function findMethodCallsWithName(
  sourceFile: ts.SourceFile,
  methodName: MethodName
) {
  let res: LooseObject[] = [];
  // getNamedDeclarations is not currently public
  forAllVarDecls(sourceFile, (el: ts.Declaration) => {
    if (isMethodCall(el, methodName)) {
      if (
        ts.isCallExpression(el.initializer) &&
        el.initializer.arguments.length
      ) {
        let nodeProps = el.initializer.arguments[0];
        let props = findProps(nodeProps, methodName);
        // props is an array of LooseObject
        res = res.concat(props);
      }
    }
  })
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
  let sourceFile = ts.createSourceFile(
    "file.ts",
    contents,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ false,
    ts.ScriptKind.TSX
  );

  let elements = findJsxOpeningLikeElementsWithName(
    sourceFile,
    "FormattedMessage"
  );
  let dm = findMethodCallsWithName(
    sourceFile,
    "defineMessages"
  );
  let fm = findMethodCallsWithName(
    sourceFile,
    "formatMessage"
  );

  let res = elements
    .map(element => {
      let msg: LooseObject = {};
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
