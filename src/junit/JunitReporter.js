jasmineRequire.JunitReporter = function(j$) {

  var noopTimer = {
    start: function(){},
    elapsed: function(){ return 0; }
  };

  function JunitReporter(options) {
    var env = options.env || {},
        timer = options.timer || noopTimer,
        output = '',
        specsExecuted = 0,
        failureCount = 0,
        failedSpecs = [],
        pendingSpecCount = 0;

    var totalSpecsDefined;

    this.jasmineStarted = function(options) {
      totalSpecsDefined = options.totalSpecsDefined || 0;
      timer.start();
      output += '<?xml version="1.0" encoding="UTF-8" ?>\n';
      output += '<testsuites>\n';
    };

    var topResults = new j$.ResultsNode({}, "", null),
      currentParent = topResults;

    this.suiteStarted = function(result) {
      result.startTime = new Date();
      currentParent.addChild(result, "suite");
      currentParent = currentParent.last();
    };

    this.suiteDone = function(result) {
      if (currentParent == topResults) {
        return;
      }
      result.duration = ( new Date() - result.startTime ) / 1000;
      currentParent = currentParent.parent;
    };

    this.specStarted = function(result) {
      result.startTime = new Date();
      currentParent.addChild(result, "spec");
    };

    var failures = [];

    this.specDone = function(result) {
      result.duration = ( new Date() - result.startTime ) / 1000;

      if (result.status != "disabled") {
        specsExecuted++;
      }

      if (result.status == "failed") {
        failureCount++;

        var pointer = currentParent;
        while(pointer.parent) {
          pointer.failed++;
          pointer = pointer.parent;
        }
        currentParent.failedExpectations = result.failedExpectations;
      }

      if (result.status == "pending") {
        pendingSpecCount++;
      }

      if (result.status == 'passed') {
        var pointer = currentParent;
        while(pointer.parent) {
          pointer.passed++;
          pointer = pointer.parent;
        }
      }
    };

    this.jasmineDone = function() {
      for (var i = 0; i < topResults.children.length; i++) {
        processResult(topResults.children[i], 1);
      }

      output += '</testsuites>';

      window.__phantom_writeFile("reports/results.xml", output);
    };

    return this;

    function processResult(result, depth) {
      var indent = '';
      for (var i = 0; i < depth; i++) {
        indent += '  ';
      }

      if (result.type == 'suite') {
        output += indent + getSuiteOpening(result) + '\n';
      } else if (result.type == 'spec') {
        output += indent + getSpecOutput(result, indent) + '\n';
      }

      for (var i = 0; i < result.children.length; i++) {
        processResult(result.children[i], depth + 1);
      }

      if (result.type == 'suite') {
        output += indent + getSuiteEnd() + '\n';
      }
    };

    function getSuiteOpening(suite) {
      var res = '<testsuite ';
      res += attributesToString({
        name: suite.result.description,
        duration: suite.result.duration,
        timestamp: suite.result.startTime,
        tests: suite.failed + suite.passed,
        failures: suite.failed
      });
      return res + ' />';
    }

    function getSuiteEnd() {
      return "</testsuite>";
    }

    function getSpecOutput(spec, indent) {
      var res = '<testcase ';
      res += attributesToString({
        classname: spec.result.description,
        duration: spec.result.duration, 
        result: spec.result.status 
      });
      if (spec.result.status === "failed") {
        res += ">\n";
        res += processFailure(spec.result, indent + '  ');
        return res + indent + '</testcase>'
      } else {
        return res + ' />';
      }
    }

    function processFailure(result, indent) {
      var failedExpectations = result.failedExpectations,
          result = '';

      for (var i = 0; i < failedExpectations.length; i++) {
        var fe = failedExpectations[i];
        var res = indent + '<failure>' + parseStack(fe.stack) + '\n';
        return res + '</failure>\n';
      }
    }

    function parseStack(stack) {
      return stack.replace(/[\n]*.*jasmine.*\n/g,'.');
    }

    function attributesToString(attrs) {
      var res = [];
      for (var key in attrs) {
        res.push(key + '="' + attrs[key] + '"');
      }
      return res.join(' ');
    }

    function pluralize(singular, count) {
      var word = (count == 1 ? singular : singular + "s");

      return "" + count + " " + word;
    }
  }

  return JunitReporter;
};

jasmineRequire.JunitSpecReporter = function() {
  function JunitSpecReporter(options) {
    var filterString = options && options.filterString() && options.filterString().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    var filterPattern = new RegExp(filterString);

    this.matches = function(specName) {
      return filterPattern.test(specName);
    };
  }

  return JunitSpecReporter;
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
  }

  return ResultsNode;
};