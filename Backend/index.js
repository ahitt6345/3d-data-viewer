const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
var fs = require("fs");
var path = require("path");
var OpenAI = require("openai");
var io = require("socket.io")(server);
var process = require("process");
const sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("companies.db");
var csv = require("csv-parser");

const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { HNSWLib } = require("@langchain/community/vectorstores/hnswlib");
const { formatDocumentsAsString } = require("langchain/util/document");
const { PromptTemplate } = require("@langchain/core/prompts");
const {
	RunnableSequence,
	RunnablePassthrough,
} = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const model = new ChatOpenAI({
	apiKey: process.env.apiKey,
	model: "gpt-4o",
});
var vectorStore;
var vectorRetriever;
//var companyDescriptions = []; // array to store company descriptions

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

async function initializeVectorStore() {
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
	vectorRetriever = vectorStore.asRetriever({
		k: (companyDescriptions.length / 4) | 0,
	});

	db.all("SELECT company FROM companies", [], (err, rows) => {
		if (err) {
			throw err;
		}
		rows.forEach((row) => {
			companyNamesInDatabase[row.company] = true;
		});
	});
}

async function retrieveCompanyNamesRelevantToRequest(request) {
	const prompt =
		PromptTemplate.fromTemplate(`Answer the prompt based on the given context:
{context}

Be sure to only output a comma-separated list of company names that fit the criteria given in the question.
Prompt: {question}`); // PromptTemplate is a class that allows you to create a prompt template that can be used to generate prompts
	const chain = RunnableSequence.from([
		{
			context: vectorRetriever.pipe(formatDocumentsAsString),
			question: new RunnablePassthrough(),
		},
		prompt,
		model,
		new StringOutputParser(),
	]);

	const result = await chain.invoke(request);

	console.log(result);

	var companynamesfromrag = result.split(", ").join(",").split(",");
	console.log(companynamesfromrag);
	return companynamesfromrag;
}
const client = new OpenAI({
	apiKey: process.env.apiKey,
});
app.get("*", (req, res) => {
	// This is a catch all for all requests, however we need to restructure this so that it only serves files from the frontend folder.
	var dir = path.join(__dirname, "./Frontend");
	res.sendFile(dir + req.url);
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});

var companySphereServerSide = function (
	x,
	y,
	z,
	radius,
	companyData,
	applicationSphere
) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.radius = radius;
	this.companyData = companyData;
	this.applicationSphere = applicationSphere.application;
};
companySphereServerSide.prototype.toTuple = function () {
	return [
		this.x,
		this.y,
		this.z,
		this.radius,
		this.companyData,
		this.applicationSphere.application,
	];
};

var applicationSphereServerSide = function (x, y, z, radius, application) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.radius = 120;
	this.application = application;
	this.companies = [];
};
applicationSphereServerSide.prototype.addCompany = function (companyData) {
	var applicationSphereRadius = this.radius;
	var newCompanySphereRadius = 30;
	var x, y, z;
	[x, y, z] = [0, 0, 0];
	var newCompanySphere = new companySphereServerSide(
		x,
		y,
		z,
		newCompanySphereRadius,
		companyData,
		this
	);
	this.companies.push(newCompanySphere);
};
applicationSphereServerSide.prototype.toTuple = function () {
	return [
		this.x,
		this.y,
		this.z,
		this.radius,
		this.application,
		this.companies.map((company) => company.toTuple()),
	];
};

function generateApplicationSpheresForSplines(data) {
	var applications = {}; // This will be used to store the unique applications
	for (var i = 0; i < data.length; i++) {
		applications[data[i].application] = applications[data[i].application]
			? applications[data[i].application] + 1
			: 1; // Count the number of companies that use each application
	}
	var applicationsArray = Object.keys(applications); // Get the array of unique applications
	// console.log(applicationsArray);
	var applicationSpheres = [];
	let applicationSphereRadius = 120;
	for (let i = 0; i < applicationsArray.length; i++) {
		// generate the application spheres, we dont care where they are positioned currently. initialize them all at (0,0,0)
		let x = 0,
			y = 0,
			z = 0;

		let applicationSphere = new applicationSphereServerSide(
			x,
			y,
			z,
			applicationSphereRadius,
			applicationsArray[i]
		);
		applicationSpheres.push(applicationSphere);
	}
	// sort the applicationspheres from most companies to least companies
	applicationSpheres.sort(
		(a, b) => applications[b.application] - applications[a.application]
	);

	// Reassign the application sphere positions to represent multiple straight lines next to each other

	var spheresPerRow = 10;
	var rowSpacing = 200;
	var columnSpacing = applicationSphereRadius * 2 + 100;
	var numRows = Math.ceil(applicationSpheres.length / spheresPerRow);

	applicationSpheres.forEach((sphere, index) => {
		var row = Math.floor(index / spheresPerRow);
		var col = index % spheresPerRow;
		var x = col * columnSpacing - (spheresPerRow - 1) * columnSpacing;
		var z = row * rowSpacing * 1.5;
		sphere.x = x;
		sphere.z = z;
	});

	// Assign companies to application spheres
	for (var i = 0; i < data.length; i++) {
		var foundApplicationSphere = false;
		for (var j = 0; j < applicationSpheres.length; j++) {
			if (data[i].application === applicationSpheres[j].application) {
				applicationSpheres[j].addCompany(data[i]);
				foundApplicationSphere = true;
				break;
			}
		}
		if (!foundApplicationSphere) {
			console.log(
				"Failed to find application sphere for company: ",
				data[i].company
			);
		}
	}

	var result = applicationSpheres.map((sphere) => sphere.toTuple());
	// console.log(JSON.stringify(result));
	return result;
}

/*
async function extractCompaniesthatAreRelevantToPrompt(prompt) {
	// we are going to tell an AI the headers of our sql table and then we will tell the AI to generate an sql  query that will filter the data based on the prompt
	// we will then pass the query to the sqlite database and return the results, then we will convert the results to application spheres
	// we will then return the application spheres
	var promptstr =
		`The companies table has the following columns: (company TEXT, url TEXT, description TEXT, industry TEXT, latest_funding_round TEXT, total_funding TEXT, all_investors TEXT, latest_valuation TEXT, latest_funding_amount TEXT, mosaic TEXT, application TEXT). The description column provides a paragraph description about what the company does, the mosaic is just a metric that measures how good the company is: the higher the better, the other columns are mostly self-explanatory.` +
		` Generate an SQLite query that returns the companies that best fit the prompt: '${prompt}' Only provide the SQL query, the string will be passed to the database to retrieve the data, do attempt to use the necessary columns in order to find companies that fit the prompt better. Don't even add the backtick code formatting, just the query.`;
	console.log(promptstr);
	const response = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [
			{
				role: "system",
				content:
					"You are a data analyst who specializes in businesses and SQL. Your job is to generate SQL queries for a database.",
			},
			{ role: "user", content: promptstr },
		],
	});
	var query = response.choices[0].message.content;
	console.log("Generated query: ");
	console.log(query);

	// Use a promise to handle the asynchronous database query
	return new Promise((resolve, reject) => {
		console.log("Querying database");
		db.all(query, [], (err, rows) => {
			if (err) {
				reject(err); // Reject the promise with the error
			} else {
				resolve(rows); // Resolve the promise with the results
			}
		});
	});
}*/

async function getRowsOfUsingCompanyNames(companyNames) {
	// some names in this list are not in the database, we need to check if the name is in the database before we query it
	// var companyNamesInDatabase = {};

	// Now that we know which companies are in the database, we can filter out the companies that are not in the database from the list of company names
	companyNames = companyNames.filter(
		(companyName) => companyNamesInDatabase[companyName]
	);
	// Now we can query the database for the companies that are in the list of company names
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM companies WHERE company IN (" +
				companyNames
					.map((companyName) => `'${companyName}'`)
					.join(",") +
				")",
			[],
			(err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			}
		);
	});
}
async function extractCompaniesthatAreRelevantToPrompt(request) {
	// we are going to use a RAG model to generate the companies that are relevant to the request
	// we will then return the names of the companies
	const names = await retrieveCompanyNamesRelevantToRequest(request);
	const rows = await getRowsOfUsingCompanyNames(names);
	return rows;
}
var filename = "gendata_headers_cleaned_up.csv";
var fileheaders = [];
var companyNamesInDatabase = {};
console.log(fileheaders);
// headers are company,url,description,industry,latest_funding_round,total_funding,all_investors,latest_valuation,latest_funding_amount,mosaic,application

// if companies.db does not exist, create it and populate it with the data from the csv file
if (!fs.existsSync("companies.db")) {
	db.serialize(() => {
		// Clear the table if it exists
		db.run("DROP TABLE IF EXISTS companies");
		// create the table if it does not exist
		db.run(
			"CREATE TABLE IF NOT EXISTS companies (company TEXT, url TEXT, description TEXT, industry TEXT, latest_funding_round TEXT, total_funding TEXT, all_investors TEXT, latest_valuation TEXT, latest_funding_amount TEXT, mosaic TEXT, application TEXT)"
		);
		var stmt = db.prepare(
			"INSERT INTO companies VALUES (?,?,?,?,?,?,?,?,?,?,?)"
		);
		fs.createReadStream(filename)
			.pipe(csv())
			.on("headers", (headers) => {
				fileheaders = headers;
				console.log("Headers: ", headers);
			})
			.on("data", (row) => {
				if (row.application === "") {
					console.log("No application for company: ", row.company);
				}
				stmt.run(
					row.company,
					row.url,
					row.description,
					row.industry,
					row.latest_funding_round,
					row.total_funding,
					row.all_investors,
					row.latest_valuation,
					row.latest_funding_amount,
					row.mosaic,
					row.application
				);
			})
			.on("end", () => {
				stmt.finalize();
				// this is where we start sending data to the frontend
				initializeVectorStore();
			});
	});
} else {
	// if the database already exists, we will initialize the vector store
	initializeVectorStore();
}
io.on("connection", (socket) => {
	socket.on("getdata", () => {
		// this is the initial data pull. we send everything in the database to the frontend
		db.all("SELECT * FROM companies", [], (err, rows) => {
			if (err) {
				throw err;
			}
			socket.emit("data", generateApplicationSpheresForSplines(rows));
		});
	});
	socket.on("chat message", async (msg) => {
		// this is the chat message event. we will send the message to the AI and then we will send the response to the frontend
		console.log("message: " + msg);
		var response = await extractCompaniesthatAreRelevantToPrompt(msg);

		socket.emit(
			"PromptResponse",
			generateApplicationSpheresForSplines(response)
		);
	});
	socket.on("disconnect", () => {
		console.log("user disconnected");
	});
});
