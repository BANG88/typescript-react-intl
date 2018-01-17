import ts = require("typescript");

function isMethodCall(
  el: ts.Declaration,
  methodName: string,
): el is ts.VariableDeclaration {
  return (
    ts.isVariableDeclaration(el) &&
    !!el.initializer &&
    ts.isCallExpression(el.initializer) &&
    el.initializer.expression &&
    ts.isIdentifier(el.initializer.expression) &&
    el.initializer.expression.text === methodName
  );
}

// Should be pretty fast: https://stackoverflow.com/a/34491287/14379
// tslint:disable-next-line:no-any
function emptyObject(obj: any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

// just a map of string to string
interface Message {
  [key: string]: string;
}

type ElementName = "FormattedMessage";
type MethodName = "defineMessages" | "formatMessage";
type MessageExtracter = (obj: ts.ObjectLiteralExpression) => Message[];

function extractMessagesForDefineMessages(
  objLiteral: ts.ObjectLiteralExpression,
): Message[] {
  const messages: Message[] = [];
  objLiteral.properties.forEach((p) => {
    const message: Message = {};
    if (
      ts.isPropertyAssignment(p) &&
      ts.isObjectLiteralExpression(p.initializer) &&
      p.initializer.properties
    ) {
      p.initializer.properties.forEach((ip) => {
        if (
          ip.name &&
          (ts.isIdentifier(ip.name) || ts.isLiteralExpression(ip.name))
        ) {
          const name = ip.name.text;
          if (
            ts.isPropertyAssignment(ip) &&
            ts.isStringLiteral(ip.initializer)
          ) {
            message[name] = ip.initializer.text;
          }
          // else: key/value is not a string literal/identifier
        }
      });
      messages.push(message);
    }
  });
  return messages;
}

function extractMessagesForFormatMessage(
  objLiteral: ts.ObjectLiteralExpression,
): Message[] {
  const message: Message = {};
  objLiteral.properties.forEach((p) => {
    if (
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isLiteralExpression(p.name)) &&
      ts.isStringLiteral(p.initializer)
    ) {
      message[p.name.text] = p.initializer.text;
    }
    // else: key/value is not a string literal/identifier
  });
  return [message];
}

function extractMessagesForNode(
  node: ts.Node,
  extractMessages: MessageExtracter,
): Message[] {
  const res: Message[] = [];
  function find(n: ts.Node): Message[] | undefined {
    if (ts.isObjectLiteralExpression(n)) {
      res.push(...extractMessages(n));
      return undefined;
    } else {
      return ts.forEachChild(n, find);
    }
  }
  find(node);
  return res;
}

function forAllVarDecls(
  node: ts.Node,
  cb: (decl: ts.VariableDeclaration) => void,
) {
  if (ts.isVariableDeclaration(node)) {
    cb(node);
  } else {
    ts.forEachChild(node, (n) => forAllVarDecls(n, cb));
  }
}

function findJsxOpeningLikeElementsWithName(
  node: ts.SourceFile,
  tagName: ElementName,
) {
  const messages: ts.JsxOpeningLikeElement[] = [];
  function findJsxElement(n: ts.Node): undefined {
    // Is this a JsxElement with an identifier name?
    if (ts.isJsxOpeningLikeElement(n) && ts.isIdentifier(n.tagName)) {
      // Does the tag name match what we're looking for?
      const childTagName = n.tagName;
      if (childTagName.text === tagName) {
        messages.push(n);
      }
    }
    return ts.forEachChild(n, findJsxElement);
  }
  findJsxElement(node);
  return messages;
}

function findMethodCallsWithName(
  sourceFile: ts.SourceFile,
  methodName: MethodName,
  extractMessages: MessageExtracter,
) {
  let messages: Message[] = [];
  // getNamedDeclarations is not currently public
  forAllVarDecls(sourceFile, (decl: ts.Declaration) => {
    if (isMethodCall(decl, methodName)) {
      if (
        decl.initializer &&
        ts.isCallExpression(decl.initializer) &&
        decl.initializer.arguments.length
      ) {
        const nodeProps = decl.initializer.arguments[0];
        const declMessages = extractMessagesForNode(nodeProps, extractMessages);
        messages = messages.concat(declMessages);
      }
    }
  });
  return messages;
}

/**
 * Parse tsx files
 */
// TODO perhaps we should expose the Message interface
// tslint:disable-next-line:array-type
function main(contents: string): {}[] {
  const sourceFile = ts.createSourceFile(
    "file.ts",
    contents,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ false,
    ts.ScriptKind.TSX,
  );

  const elements = findJsxOpeningLikeElementsWithName(
    sourceFile,
    "FormattedMessage",
  );
  const dm = findMethodCallsWithName(
    sourceFile,
    "defineMessages",
    extractMessagesForDefineMessages,
  );
  // TODO formatMessage might not be the initializer for a VarDecl
  // eg console.log(formatMessage(...))
  const fm = findMethodCallsWithName(
    sourceFile,
    "formatMessage",
    extractMessagesForFormatMessage,
  );

  // convert JsxOpeningLikeElements to Message maps
  const jsxMessages = elements
    .map((element) => {
      const msg: Message = {};
      element.attributes &&
        element.attributes.properties.forEach((attr: ts.JsxAttributeLike) => {
          // found nothing
          // tslint:disable-next-line:no-any
          const a = attr as any; // TODO find correct types to avoid "any"
          if (!a.name || !a.initializer) {
            return;
          }
          msg[a.name.text] =
            a.initializer.text || a.initializer.expression.text;
        });
      return msg;
    })
    .filter((r) => !emptyObject(r));

  return jsxMessages.concat(dm).concat(fm);
}

export default main;
