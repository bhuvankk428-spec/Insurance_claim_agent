import { askRAG } from "./rag.js";

const result = await askRAG({
  question: "Does health insurance cover hospitalization?",
  domain: "Health Insurance",
});

console.log(result);
process.exit();
