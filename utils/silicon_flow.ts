import { createOpenAI } from "@ai-sdk/openai";

export const silicon_flow = createOpenAI({
  apiKey: process.env.SILICON_FLOW_API_KEY,
  baseURL: process.env.SILICON_FLOW_BASE_URL,
  compatibility: "strict", // so stream_options will be sent
});


export default silicon_flow;