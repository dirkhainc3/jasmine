describe("JunitReporter", function() {
  var reporter, output;

  beforeEach(function() {
    reporter = new j$.JunitReporter();
    spyOn(reporter, 'writeToFile').and.callFake(function(path, o) {
      output = o;
    });
  });

  it("starts with an xml tag", function() {
    reporter.jasmineStarted();
    reporter.jasmineDone();

    expect(reporter.writeToFile).toHaveBeenCalled();

    expect(new RegExp(/xml/).test(output)).toBeTruthy();
  });


  // it("reports a failing spec", function() {
  //   var reporter = new j$.ConsoleReporter({
  //     print: out.print
  //   });

  //   reporter.specDone({status: "failed"});

  //   expect(out.getOutput()).toEqual("F");
  // });

  // it("reports a passing spec", function() {
  //   var reporter = new j$.ConsoleReporter({
  //     print: out.print
  //   });

  //   reporter.specDone({status: "pending"});

  //   expect(out.getOutput()).toEqual("*");
  // });

  // it("reports a summary when done (singluar spec and time)", function() {
  //   var timerSpy = jasmine.createSpyObj('timer', ['start', 'elapsed']),
  //       reporter = new j$.ConsoleReporter({
  //         print: out.print,
  //         timer: timerSpy
  //       });

  //   reporter.jasmineStarted();
  //   reporter.specDone({status: "passed"});

  //   timerSpy.elapsed.and.callReturn(1000);

  //   out.clear();
  //   reporter.jasmineDone();

  //   expect(out.getOutput()).toMatch(/1 spec, 0 failures/);
  //   expect(out.getOutput()).not.toMatch(/0 pending specs/);
  //   expect(out.getOutput()).toMatch("Finished in 1 second\n");
  // });
});
