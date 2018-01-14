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

// just a map of string to any
interface Message {
  [key: string]: any
}

type ElementName = "FormattedMessage";
type MethodName = "defineMessages" | "formatMessage";
type MessageExtracter = (obj: ts.ObjectLiteralExpression) => Message[]

function extractMessagesForDefineMessages(objLiteral: ts.ObjectLiteralExpression): Message[] {
  var messages: Message[] = [];
  objLiteral.properties.forEach(p => {
    var message: Message = {};
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

function extractMessagesForFormatMessage(objLiteral: ts.ObjectLiteralExpression): Message[] {
  var message: Message = {};
  objLiteral.properties.forEach(p => {
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

function extractMessagesForNode(node: ts.Node, extractMessages: MessageExtracter): Message[] {
  var res: Message[] = [];
  function find(node: ts.Node): Message[] {
    if (ts.isObjectLiteralExpression(node)) {
      res.push(...extractMessages(node));
    } else {
      return ts.forEachChild(node, find);
    }
  }
  find(node);
  return res;
}

function forAllVarDecls(node: ts.Node, cb: (decl: ts.VariableDeclaration) => void) {
  if (ts.isVariableDeclaration(node)) {
    cb(node)
  } else {
    ts.forEachChild(node, n => forAllVarDecls(n, cb))
  }
}

function findJsxOpeningLikeElementsWithName(
  node: ts.SourceFile,
  tagName: ElementName
) {
  let messages: ts.JsxOpeningLikeElement[] = [];
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
        messages.push(node);
      }
    }
    return ts.forEachChild(node, findJsxElement);
  }
  findJsxElement(node);
  return messages;
}

function findMethodCallsWithName(
  sourceFile: ts.SourceFile,
  methodName: MethodName,
  extractMessages: MessageExtracter
) {
  let messages: Message[] = [];
  // getNamedDeclarations is not currently public
  forAllVarDecls(sourceFile, (decl: ts.Declaration) => {
    if (isMethodCall(decl, methodName)) {
      if (
        ts.isCallExpression(decl.initializer) &&
        decl.initializer.arguments.length
      ) {
        let nodeProps = decl.initializer.arguments[0];
        let declMessages = extractMessagesForNode(nodeProps, extractMessages);
        messages = messages.concat(declMessages);
      }
    }
  })
  return messages;
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
    "defineMessages",
    extractMessagesForDefineMessages
  );
  let fm = findMethodCallsWithName(
    sourceFile,
    "formatMessage",
    extractMessagesForFormatMessage
  );

  // convert JsxOpeningLikeElements to Message maps
  let jsxMessages = elements
    .map(element => {
      let msg: Message = {};
      element.attributes &&
        element.attributes.properties.forEach((attr: Message) => {
          // found nothing
          if (!attr.name || !attr.initializer) return;
          msg[attr.name.text] =
            attr.initializer.text || attr.initializer.expression.text;
        });
      return msg;
    })
    .filter(r => !emptyObject(r));

  return jsxMessages.concat(dm).concat(fm);
}

export default main;
