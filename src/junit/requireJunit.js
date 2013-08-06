jasmineRequire.junit = function(j$) {
  j$.ResultsNode = jasmineRequire.ResultsNode();
  j$.JunitReporter = jasmineRequire.JunitReporter(j$);
  j$.JunitSpecReporter = jasmineRequire.JunitSpecReporter();
};
