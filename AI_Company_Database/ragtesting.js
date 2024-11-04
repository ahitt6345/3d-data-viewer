const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { HNSWLib } = require("@langchain/community/vectorstores/hnswlib");
const { formatDocumentsAsString } = require("langchain/util/document");
const { PromptTemplate } = require("@langchain/core/prompts");
const {
	RunnableSequence,
	RunnablePassthrough,
} = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const sqlite3 = require("sqlite3").verbose();

// (company TEXT, url TEXT, description TEXT, industry TEXT, latest_funding_round TEXT, total_funding TEXT, all_investors TEXT, latest_valuation TEXT, latest_funding_amount TEXT, mosaic TEXT, application TEXT)
var db = new sqlite3.Database("companies.db");

const model = new ChatOpenAI({
	apiKey: process.env.apiKey,
	model: "gpt-4o",
});
var vectorStore;
var companyDescriptions = []; // array to store company descriptions

async function extractCompaniesFromSQLDB() {
	var companyProperties = []; // array to store all company properties except descriptions
	var companyDescriptions = []; // array to store company descriptions

	// get all company descriptions
	await new Promise((resolve, reject) => {
		db.all("SELECT description FROM companies", function (err, rows) {
			if (err) reject(err);
			rows.forEach(function (row) {
				companyDescriptions.push(row.description);
			});
			resolve();
		});
	});

	// get all company properties except descriptions
	await new Promise((resolve, reject) => {
		db.all(
			"SELECT company, url, industry, latest_funding_round, total_funding, all_investors, latest_valuation, latest_funding_amount, mosaic, application FROM companies",
			function (err, rows) {
				if (err) reject(err);
				rows.forEach(function (row) {
					Object.keys(row).forEach((key) => {
						if (row[key].indexOf(",") !== -1) {
							row[key] = row[key].split(",");
						}
					});
					companyProperties.push(row);
				});
				resolve();
			}
		);
	});

	// console.log(companyDescriptions);
	// console.log(companyProperties);

	return { companyDescriptions, companyProperties };
}

// extractCompaniesFromSQLDB();
(async () => {
	const { companyDescriptions, companyProperties } =
		await extractCompaniesFromSQLDB();

	vectorStore = await HNSWLib.fromTexts(
		companyDescriptions,
		companyProperties.map((properties, index) => ({
			id: index,
			...properties,
		})),
		new OpenAIEmbeddings({
			apiKey: process.env.apiKey,
			model: "text-embedding-ada-002",
		})
	);
	const retriever = vectorStore.asRetriever({
		k: (companyDescriptions.length / 2) | 0,
	});

	const prompt =
		PromptTemplate.fromTemplate(`Answer the following question based only on the provided company data:
{context}

Be sure to only output a comma-separated list of company names that fit the criteria given in the question.
Question: {question}`); // PromptTemplate is a class that allows you to create a prompt template that can be used to generate prompts
	const chain = RunnableSequence.from([
		{
			context: retriever.pipe(formatDocumentsAsString),
			question: new RunnablePassthrough(),
		},
		prompt,
		model,
		new StringOutputParser(),
	]);

	const result = await chain.invoke("Find companies based in California.");

	console.log(result);

	var companynamesfromrag = result.split(", ").join(",").split(",");
	console.log(companynamesfromrag);
	var companies = [];
	companynamesfromrag.forEach((name) => {
		var companyData;
		var companyIndex;
		for (let i = 0; i < companyProperties.length; i++) {
			if (companyProperties[i]["company"] === name) {
				companyData = companyProperties[i];
				companyIndex = i;
				break;
			}
		}
		if (!companyData) {
			console.log("Company not found: ", name);
			//throw new Error(`Company not found: ${name}`);
			return;
		}
		// attach description to company data
		companyData.description = companyDescriptions[companyIndex];
		companies.push(companyData);
	});
	//console.log(companies);
})();
