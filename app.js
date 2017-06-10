/// <reference path="../node_modules/ava/types/generated.d.ts" />
var p = require("../lib").default;

var fs = require("fs");
function A() {
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
}
function B() {
  var content = fs.readFileSync(__dirname + "/app/empty.tsx");

  var res = p(content.toString());

  var expected = [];
  console.log(res);
}
function C() {
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
}
function D() {
  var content = fs.readFileSync(__dirname + "/app/statelessComponent.tsx");

  var res = p(content.toString());

  var expected = [{ id: "i.am.ok", defaultMessage: "yep" }];
}
// A()
D();
