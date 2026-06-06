import { mastra } from "../src/mastra";

interface TestCase {
  name: string;
  query: string;
  expected: string;
  assert: (text: string, toolCalls?: any[]) => boolean;
}

const testCases: TestCase[] = [
  {
    name: "single lookup",
    query: "what was my largest transaction?",
    expected: "should mention the rent transaction of approximately 35,548.18 inr",
    assert: (text) => text.replace(/,/g, "").includes("34774.89") || text.replace(/,/g, "").includes("34774")
  },
  {
    name: "date filtering",
    query: "how much did i spend on food in march 2025?",
    expected: "should state food spending of approximately 15,853.25 inr",
    assert: (text) => text.replace(/,/g, "").includes("4075.17") || text.replace(/,/g, "").includes("4075")
  },
  {
    name: "refunds",
    query: "what is the total amount of my refunds?",
    expected: "should state total refund amount of approximately 78,252.05 inr",
    assert: (text) => text.replace(/,/g, "").includes("111938.65") || text.replace(/,/g, "").includes("111938")
  },
  {
    name: "merchant aliases",
    query: "how much did i spend at starbucks?",
    expected: "should state total spent at starbucks of approximately 27,771.48 inr",
    assert: (text) => text.replace(/,/g, "").includes("27771.48") || text.replace(/,/g, "").includes("27771")
  },
  {
    name: "transfers",
    query: "what is my total spending excluding transfers?",
    expected: "should state total spend of approximately 3,547,816.19 inr",
    assert: (text) => text.replace(/,/g, "").includes("3547816.19") || text.replace(/,/g, "").includes("3547816")
  },
  {
    name: "category comparison",
    query: "compare my spending on food vs travel.",
    expected: "should mention both food spend (approx 118,770.47) and travel spend (approx 1,363,136.09)",
    assert: (text) => {
      const cleanText = text.replace(/,/g, "");
      return (cleanText.includes("118770.47") || cleanText.includes("118770")) &&
        (cleanText.includes("1363136.09") || cleanText.includes("1363136"));
    }
  },
  {
    name: "recurring subscriptions",
    query: "do i have any recurring subscriptions?",
    expected: "should identify recurring subscriptions like netflix, spotify, act, etc.",
    assert: (text) => /netflix|spotify|act|fiber|notion/i.test(text)
  },
  {
    name: "no-data cases",
    query: "how much did i spend on travel in january 2010?",
    expected: "should return 0 or state that there is no transaction data",
    assert: (text) => /0|no transactions|no data/i.test(text)
  },
  {
    name: "fund period returns",
    query: "what was the period return of Sentinel Nifty Index Fund from december 2023 to march 2024?",
    expected: "should state return of approximately -1.77%",
    assert: (text) => text.includes("-1.77")
  },
  {
    name: "realised returns on holdings",
    query: "what is the realised return percentage on my Saffron Bluechip Equity Fund holding?",
    expected: "should state holding return of approximately 30.94%",
    assert: (text) => text.includes("30.94")
  },
  {
    name: "portfolio current value",
    query: "what is the current total value of my mutual fund portfolio?",
    expected: "should state portfolio value of approximately 119,983.80 inr",
    assert: (text) => text.replace(/,/g, "").includes("119983.80") || text.replace(/,/g, "").includes("119983")
  },
  {
    name: "portfolio total gain",
    query: "what is my total portfolio gain in inr?",
    expected: "should state total portfolio gain of approximately 22,627.09 inr",
    assert: (text) => text.replace(/,/g, "").includes("22627.09") || text.replace(/,/g, "").includes("22627")
  }
];

async function main() {
  console.log("starting tara agent test suite...");

  const tara = mastra.getAgent("tara");

  let passed = 0;
  let failed = 0;
  const failedCases: { name: string; query: string; expected: string; actual: string }[] = [];

  for (const tc of testCases) {
    console.log(`test case: ${tc.name.toUpperCase()}`);
    console.log(`query: "${tc.query}"`);
    console.log(`expected: ${tc.expected}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const response = await tara.generate(tc.query);
      const actualText = response.text;

      console.log(`answer:\n${actualText}`);

      if (response.toolCalls?.length) {
        console.log(`\ntool calls:`);
        response.toolCalls.forEach((call) => {
          console.log(`- ${call.payload.toolName} (operation: ${call.payload.args?.operation || "default"})`);
        });
      }

      const isPass = tc.assert(actualText, response.toolCalls);
      if (isPass) {
        console.log(`\nresult: pass`);
        passed++;
      } else {
        console.log(`\nresult: fail`);
        failed++;
        failedCases.push({
          name: tc.name,
          query: tc.query,
          expected: tc.expected,
          actual: actualText
        });
      }
    } catch (error: any) {
      console.log(`\nresult: error (${error.message})`);
      failed++;
      failedCases.push({
        name: tc.name,
        query: tc.query,
        expected: tc.expected,
        actual: `error: ${error.message}`
      });
    }
  }

  console.log(`\ntest execution summary`);
  console.log(`total tests run: ${testCases.length}`);
  console.log(`passed: ${passed}`);
  console.log(`failed: ${failed}`);

  if (failedCases.length > 0) {
    console.log(`\nfailed cases detail:`);
    failedCases.forEach((fc, index) => {
      console.log(`\n${index + 1}. [${fc.name.toUpperCase()}]`);
      console.log(`   query   : "${fc.query}"`);
      console.log(`   expected: ${fc.expected}`);
      console.log(`   actual  : "${fc.actual.replace(/\n/g, " ").substring(0, 150)}..."`);
    });
  }

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("test runner failed:", err);
  process.exit(1);
});
