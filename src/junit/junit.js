/*
Copyright (c) 2008-2013 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
jasmineRequire.junit = function(j$) {
  j$.ResultsNode = jasmineRequire.ResultsNode();
  j$.JunitReporter = jasmineRequire.JunitReporter(j$);
};

jasmineRequire.JunitReporter = function(j$) {

  function JunitReporter(options) {
    var output = '',
        topResultsNode = new j$.ResultsNode({}, "", null),
        currentParent = topResultsNode;

    this.jasmineStarted = function(options) {
      output += '<?xml version="1.0" encoding="UTF-8" ?>\n';
      output += '<testsuites>\n';
    };

    this.suiteStarted = function(result) {
      result.startTime = new Date();
      currentParent.addChild(result, "suite");
      currentParent = currentParent.last();
    };

    this.suiteDone = function(result) {
      result.duration = ( new Date() - result.startTime ) / 1000;

      if (currentParent == topResultsNode) {
        return;
      }
      currentParent = currentParent.parent;
    };

    this.specStarted = function(result) {
      result.startTime = new Date();
      currentParent.addChild(result, "spec");
    };

    this.specDone = function(result) {
      result.duration = ( new Date() - result.startTime ) / 1000;

      if (result.status == "failed" || result.status === "passed") {
        var parentPointer = currentParent;
        while (parentPointer.parent) {
          parentPointer[result.status]++;
          parentPointer = parentPointer.parent;
        }
      }
    };

    this.jasmineDone = function() {
      for (var i = 0; i < topResultsNode.children.length; i++) {
        output += topResultsNode.children[i].getXml(1);
      }
      output += '</testsuites>';

      window.__phantom_writeFile("reports/results.xml", output);
    };

    return this;
  }

  return JunitReporter;
};

jasmineRequire.ResultsNode = function() {
  function ResultsNode(result, type, parent) {
    this.result = result;
    this.passed = 0;
    this.failed = 0;

    this.type = type;
    this.parent = parent;

    this.children = [];

    this.addChild = function(result, type) {
      this.children.push(new ResultsNode(result, type, this));
    };

    this.last = function() {
      return this.children[this.children.length - 1];
    };

    this.getXml = function(depth) {
      var xml = "";

      xml += this.getOpeningXml(depth);

      for (var i = 0; i < this.children.length; i++) {
        xml += this.children[i].getXml(depth + 1);
      }
      xml += this.getClosingXml(depth);

      return xml;
    };

    this.getOpeningXml = function(depth) {
      var xml = "";
      if (this.type == 'suite') {
        xml += this.getSuiteOpeningXml(depth);
      } else if (this.type == 'spec') {
        xml += this.getSpecXml(depth);
      }

      return xml;
    };

    this.getClosingXml = function(depth) {
      var xml = "";
      if (this.type == 'suite') {
        xml += this.getSuiteClosingXml(depth);
      }
      return xml;
    };

    this.getSuiteOpeningXml = function(depth) {
      var xml = indent("<testsuite ", depth);

      xml += attributesToString({
        name: this.result.description,
        duration: this.result.duration,
        timestamp: this.result.startTime,
        tests: this.failed + this.passed,
        failures: this.failed
      });
      xml += " />\n";

      return xml;
    };

    this.getSuiteClosingXml = function(depth) {
      return indent("</testsuite>\n", depth);
    };

    this.getSpecXml = function(depth) {
      var xml = indent("<testcase ", depth);

      xml += attributesToString({
        classname: this.result.description,
        duration: this.result.duration, 
        result: this.result.status
      });

      if (this.result.status === "failed") {
        xml += ">\n";
        xml += this.getFailureXml(depth + 1);
        xml += indent("</testcase>\n", depth);
      } else {
        xml += " />\n";
      }
      return xml;
    };

    this.getFailureXml = function(depth) {
      var xml = "";

      for (var i = 0; i < this.result.failedExpectations.length; i++) {
        var fe = this.result.failedExpectations[i];

        xml += indent("<failure>\n", depth);
        xml += formatStack(fe.stack, depth + 1);
        xml += indent("</failure>\n", depth);
        return xml;
      }
    };

    return this;

    function indent(text, depth) {
      var tab = "";
      for (var i = 0; i < depth; i++) {
        tab += "  ";
      }
      return tab + text;
    }

    // Stripping out jasmine error lines from stacktrace
    function formatStack(stack, depth) {
      var lines = (stack || '').split('\n'),
          validLines = [];

      for (var i = 0; i < lines.length; i++) {
        if (!new RegExp(/\/jasmine\//).test(lines[i])) {
          validLines.push(indent(lines[i], depth));
        }
      }
      return validLines.join('\n') + '\n';
    }

    function attributesToString(attrs) {
      var res = [];

      for (var key in attrs) {
        res.push(key + '="' + attrs[key] + '"');
      }
      return res.join(' ');
    }
  }

  return ResultsNode;
};
