import { mastra } from "../src/mastra";

async function main() {
  console.log("testing tara agent");

  const tara = mastra.getAgent("tara");

  const queries = [
    "what was my biggest expense?",
    "how much did i spend on food?",
    "which mutual fund performed the best?",
  ];

  for (const query of queries) {
    console.log(`\nquery: "${query}"`);
    const response = await tara.generate(query);
    console.log("answer:", response.text);
    if (response.toolCalls?.length) {
      console.log(
        "tool calls:",
        response.toolCalls.map((tc) => ({
          tool: tc.payload.toolName,
          args: tc.payload.args,
        }))
      );
    }
  }
}

main().catch((err) => {
  console.error("test failed:", err);
});
