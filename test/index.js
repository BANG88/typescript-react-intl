/// <reference path="../node_modules/ava/types/generated.d.ts" />
import test from "ava";
var p = require("../lib").default;

var fs = require("fs");

test("<FormattedMessage/>", t => {
  var content = fs.readFileSync(__dirname + "/app/index.tsx");

  var res = p(content.toString());

  var expected = [
    {
      id: "app",
      defaultMessage: "the defualt message"
    }
  ];

  t.is(res.length, 1);

  t.deepEqual(res, expected);
});

test("It should return empty Array when not found", async t => {
  var content = fs.readFileSync(__dirname + "/app/empty.tsx");

  var res = p(content.toString());

  var expected = [];

  t.is(res.length, 0);

  t.deepEqual(res, expected);
});

test("defineMessages() should only work with variable declaration", t => {
  var content = fs.readFileSync(__dirname + "/app/defineMessages.ts");

  var res = p(content.toString());

  var expected = [
    {
      id: "intro.hello",
      defaultMessage: "Hello world"
    },
    {
      id: "app.title",
      defaultMessage: "Hello"
    }
  ];

  t.is(res.length, 2);

  t.deepEqual(res, expected);
});

test("<FormattedMessage/> should work with StatelessComponent", t => {
  var content = fs.readFileSync(__dirname + "/app/statelessComponent.tsx");

  var res = p(content.toString());

  var expected = [{ id: "i.am.ok", defaultMessage: "yep" }];

  t.is(res.length, 1);

  t.deepEqual(res, expected);
});
