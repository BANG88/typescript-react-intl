# typescript-react-intl 
Extracts string messages from TypeScript React components or ts files that use React Intl.

[![Build Status](https://travis-ci.org/bang88/typescript-react-intl.svg?branch=master)](https://travis-ci.org/bang88/typescript-react-intl)

## Usage

> If you have many files to processes,you can get contents use node-glob with fs module 

```sh
npm i typescript-react-intl -D

var parse = require('typescript-react-intl').default;

// results is an array
// contents is your tsx file 
var results = parse(contents)


```


### React-intl

Only support `<FormattedMessage/>` and `defineMessages` We don't use `<FormattedHtmlMessage/>`


### Examples

```js

var fs = require('fs');
var glob = require('glob');
var parser = require('typescript-react-intl').default;

function runner (pattern, cb) {
  var results = [];
  pattern = pattern || 'src/**/*.@(tsx|ts)';
  glob(pattern, function (err, files) {   
    if (err) {
      throw new Error(err);
    }
    files.forEach(f => {
      var contents = fs.readFileSync(f).toString();
      var res = parser(contents);
      results = results.concat(res);
    });
   
    cb && cb(results);
  });
}

// demo 
runner(null, function (res) {

  var locale = {};

  res.forEach(r => {
    locale[r.id] = r.defaultMessage;
  });


  var locales = {
    en: locale,  
  };

  // save file to disk。you can save as a json file,just change the ext and contents as you want.
  fs.writeFileSync(`src/translations/all.ts`, `export default ${JSON.stringify(locales, null, 2)}\r`);

});


```
