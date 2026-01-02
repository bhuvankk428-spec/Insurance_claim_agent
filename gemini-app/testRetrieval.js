import { retrieveChunks } from "./retrieval.js";

const results = await retrieveChunks({
  question: "Does health insurance cover hospitalization?",
  domain: "Health Insurance",
});

console.log(results);
process.exit();
