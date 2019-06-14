/// <reference path="../node_modules/ava/types/generated.d.ts" />
import test from "ava";
var p = require("../lib").default;

var fs = require("fs");

test("<FormattedMessage/>", (t) => {
  var content = fs.readFileSync(__dirname + "/app/index.tsx");

  var res = p(content.toString(), { tagNames: ["MyComponent", "AnotherText"] });
  console.log(res);
  var expected = [
    {
      id: "app",
      defaultMessage: "the defualt message",
    },
    {
      id: "expr",
      defaultMessage: "a jsx expression",
    },
    {
      id: "configure.info",
      defaultMessage:
        "The installer has detected {numDrives, number} {numDrives, plural,\n      one {drive}\n      other {drives}\n    } and determined {numDrives, plural,\n      one {its}\n      other {their}\n    } best configuration.\n    If this is not the intended use of {numDrives, plural,\n      one {this drive}\n      other {these drives}\n    }, please change the configuration to your preferences.",
    },
    { id: "my.component", defaultMessage: "my messages" },
    { id: 'another.text', defaultMessage: 'another messages' }
  ];

  t.is(res.length, 5);

  t.deepEqual(res, expected);
});

test("It should return empty Array when not found", async (t) => {
  var content = fs.readFileSync(__dirname + "/app/empty.tsx");

  var res = p(content.toString());

  var expected = [];

  t.is(res.length, 0);

  t.deepEqual(res, expected);
});

test("defineMessages() should only work with variable declaration", (t) => {
  var content = fs.readFileSync(__dirname + "/app/defineMessages.ts");

  var res = p(content.toString());

  var expected = [
    {
      id: "intro.hello",
      defaultMessage: "Hello world",
    },
    {
      id: "app.title",
      defaultMessage: "Hello",
      description: "A description for title",
    },
    {
      id: "hello.world",
      defaultMessage: "Hello, {scope, plural,\n        =person {human}\n        =planet {world}\n        other {thing}\n      }!",
    }
  ];

  t.is(res.length, 3);

  t.deepEqual(res, expected);
});

test("defineMessages() should with export default", (t) => {
  var content = fs.readFileSync(__dirname + "/app/defineMessagesExportDefault.ts");

  var res = p(content.toString());

  var expected = [
    {
      id: "intro.hello",
      defaultMessage: "Hello world",
    },
    {
      id: "app.title",
      defaultMessage: "Hello",
      description: "A description for title",
    },
    {
      id: "hello.world",
      defaultMessage: "Hello, {scope, plural,\n        =person {human}\n        =planet {world}\n        other {thing}\n      }!",
    }
  ];

  t.is(res.length, 3);

  t.deepEqual(res, expected);
});

test("<FormattedMessage/> should work with StatelessComponent", (t) => {
  var content = fs.readFileSync(__dirname + "/app/statelessComponent.tsx");

  var res = p(content.toString());

  var expected = [{ id: "i.am.ok", defaultMessage: "yep" }];

  t.is(res.length, 1);

  t.deepEqual(res, expected);
});

test("formatMessage() API should work with a wrapped by injectIntl Component", (t) => {
  var content = fs.readFileSync(__dirname + "/app/wrappedComponent.tsx");

  var res = p(content.toString());

  var expected = [
    { id: "emailPlaceholder", defaultMessage: "Email" },
    { id: "anotherPlaceholder", defaultMessage: "Name" },
  ];

  t.is(res.length, 2);

  t.deepEqual(res, expected);
});
