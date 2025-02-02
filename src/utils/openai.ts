import { encode } from "@nem035/gpt-3-encoder";
import { Schema, Table } from "@/types";

// openAIApiKey is the API key for OpenAI API.
export const openAIApiKey = process.env.OPENAI_API_KEY;

// openAIApiEndpoint is the API endpoint for OpenAI API. Defaults to https://api.openai.com.
export const openAIApiEndpoint = process.env.OPENAI_API_ENDPOINT || "https://api.openai.com";

export const countTextTokens = (text: string) => {
  return encode(text).length;
};

export function generateDbPromptFromContext(
  promptGenerator: (input: string | undefined) => string,
  schemaList: any,
  selectedSchemaName: string,
  selectedTablesName: string[],
  maxToken: number,
  userPrompt?: string
): string {
  let schema = "";
  // userPrompt is the message that user want to send to bot. When to look prompt in drawer, userPrompt is undefined.
  let tokens = countTextTokens(userPrompt || "");

  // Empty table name(such as []) denote all table. [] and `undefined` both are false in `if`
  // The above comment is out of date. [] is true in `if` now. And no selected table should not denote all table now.
  // Because in have Token custom number in connectionSidebar. If [] denote all table. the Token will be inconsistent.
  const tableList: string[] = [];
  const selectedSchema = schemaList.find((schema: Schema) => schema.name == (selectedSchemaName || ""));
  if (selectedTablesName) {
    selectedTablesName.forEach((tableName: string) => {
      const table = selectedSchema?.tables.find((table: Table) => table.name == tableName);
      tableList.push(table!.structure);
    });
  } else {
    for (const table of selectedSchema?.tables || []) {
      tableList.push(table!.structure);
    }
  }
  if (tableList) {
    for (const table of tableList) {
      if (tokens < maxToken / 2) {
        tokens += countTextTokens(table);
        schema += table;
      }
    }
  }
  return promptGenerator(schema);
}
