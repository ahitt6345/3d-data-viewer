const fs = require("fs");
const csv = require("csv-parser");
const openai = require("openai");
const MAX_CHARS = 250; // Maximum characters for the summary
// Set up OpenAI API key
const OPENAI_API_KEY = process.env.apiKey;
//openai.apiKey = OPENAI_API_KEY; // Replace with your API key
var client = new openai({
	apiKey: OPENAI_API_KEY,
});
const inputFilePath = "gendata.csv"; // Replace with your input CSV file
const outputFilePath = "gendata_summarized_250.csv"; // Replace with the output file path

// Function to summarize the description using OpenAI API

async function summarizeDescription(description) {
	if (description.length > MAX_CHARS) {
		var prompt = `Summarize the following description in less than ${MAX_CHARS} characters:\n\n${description}`;

		const response1 = await client.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"You are a data analyst who specializes in businesses.",
				},
				{ role: "user", content: prompt },
			],
		});
		var textContent = response1.choices[0].message.content;

		return textContent.trim();
	} else {
		return description;
	}
}

// Read CSV file, summarize descriptions, and write to a new file
var descriptions = [];
var summaries = [];
async function processCSV() {
	const results = [];
	var headers;
	var csvData;
	// Read the input CSV file
	var callbacks = [];
	fs.createReadStream(inputFilePath)
		.pipe(csv())
		.on("data", async (row) => {
			descriptions.push(row["description"]);
		})
		.on("end", () => {});
}

// Start the process
processCSV();
