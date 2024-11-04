var OpenAI = require("openai");
var fs = require("fs");
var path = require("path");
var csv = require("csv-parser");
// Load your API key from an environment variable or secret management service
const OPENAI_API_KEY = process.env.apiKey;

// Create an OpenAI object
const client = new OpenAI({
	apiKey: process.env.apiKey,
});

// Read the CSV file
const filename = "gendata_final_summary_shortened.csv";
const filePath = path.join(__dirname, filename);
//gendata.csv is a file that contains data about ai companies. Companies,URL,Description,Industry,Latest Funding Round,Latest Funding Date,Total Funding,All Investors,Latest Valuation,Latest Funding Amount,Exit Round,Exit Date,Acquirers,Mosaic (Overall),Date Added,Country,Applications,Text,Speech & audio,Code,Visual media
// we are going to store the file as a string
var data = "";

data = fs.readFileSync(filePath, "utf8");

// we are going to use the openai api to ask it to generate a list of companies that sell to general consumers based on the data in the csv file

// Define the prompt
var prompt = `Generate a list of companies that sell to general consumers based on the data in the following CSV file:`;

prompt += "\n" + data;

async function generateCompanies() {
	const response = await client.chat.completions.create({
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
	// Print the response
	console.log(response.choices[0].message.content);
}

generateCompanies();
