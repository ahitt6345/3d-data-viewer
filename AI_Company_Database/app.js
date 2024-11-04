var OpenAI = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");
let Parser = require("rss-parser");
let parser = new Parser();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { Readability } = require("@mozilla/readability");

const urls = [
	"https://techcrunch.com",
	"https://www.wired.com",
	// "https://www.technologyreview.com",
	// "https://www.venturebeat.com",
	// "https://www.theverge.com",
	// "https://www.forbes.com",
	// "https://www.businessinsider.com",
	// "https://www.fastcompany.com",
	// "https://www.zdnet.com",
	// "https://www.cnet.com",
	// "https://www.bloomberg.com/technology",
	// "https://www.reuters.com/news/technology",
	// "https://www.bbc.com/news/technology",
	// "https://www.arstechnica.com",
	// "https://www.cnbc.com/technology",
	// "https://www.engadget.com",
	// "https://www.gizmodo.com",
	// "https://www.nytimes.com/section/technology",
	// "https://www.wsj.com/news/technology",
	// "https://www.spectrum.ieee.org",
];

async function checkRSSFeed(url) {
	try {
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);

		// Check for RSS feed links in <link> tags
		const rssLinks = [];
		$(
			'link[type="application/rss+xml"], link[type="application/atom+xml"]'
		).each((_, element) => {
			rssLinks.push($(element).attr("href"));
		});

		// Also check common RSS/Atom feed paths
		const commonFeedPaths = [
			"/feed",
			"/rss",
			"/rss.xml",
			"/feed.xml",
			"/atom.xml",
		];

		for (const path of commonFeedPaths) {
			const feedUrl = new URL(path, url).href;
			try {
				const feedResponse = await axios.head(feedUrl);
				if (feedResponse.status === 200) {
					rssLinks.push(feedUrl);
				}
			} catch (err) {
				// Ignore if not found
			}
		}

		return rssLinks.length > 0 ? rssLinks : "No RSS feed found";
	} catch (error) {
		return `Error: ${error.message}`;
	}
}

var RSSFeeds = [];
(async () => {
	for (const url of urls) {
		const rssFeeds = await checkRSSFeed(url);
		console.log(`RSS feeds for ${url}:`, rssFeeds);
		if (
			rssFeeds != "No RSS feed found" &&
			rssFeeds != "Error: Request failed with status code 404"
		) {
			RSSFeeds.push(rssFeeds[0]);
		}
	}
	console.log("Active RSS feeds:", RSSFeeds);
	console.log("Number of active RSS feeds:", RSSFeeds.length);
	findArticlesFromFeed();
})();

/* now that we know which rsss feeds are active, we can use them to get the latest AI news articles from each site
	remember, not all sites will have rrs feeds that look the same, so we will need to write a function that can be flexible in finding the AI company articles
*/
var aiArticleLinks;
async function getAiCompanyArticles(url) {
	var feed;
	try {
		feed = await parser.parseURL(url);
		console.log("XML feed:", feed);
		console.log(`Feed Title: ${feed.title}`);
	} catch (error) {
		console.error(`Error parsing feed from ${url}:`);
		return;
	}
	// Define keywords related to AI and companies
	const aiKeywords = [
		// General AI Terms
		"Artificial Intelligence",
		"AI",
		"A.I.",
		".ai",
		"Machine Learning",
		"ML",
		"Deep Learning",
		"Neural Network",
		"Supervised Learning",
		"Unsupervised Learning",
		"Reinforcement Learning",
		"Natural Language Processing",
		"NLP",
		"Computer Vision",
		"Robotics",
		"Automation",
		"Cognitive Computing",
		"Predictive Analytics",
		"AI Ethics",
		"AI Research",

		// Machine Learning Techniques & Algorithms
		"Algorithm",
		"Model",
		"Training",
		"Supervised Learning",
		"Unsupervised Learning",
		"Semi-Supervised Learning",
		"Reinforcement Learning",
		"Neural Network",
		"Convolutional Neural Network",
		"CNN",
		"Recurrent Neural Network",
		"RNN",
		"Long Short-Term Memory",
		"LSTM",
		"Support Vector Machine",
		"SVM",
		"Decision Tree",
		"Random Forest",
		"Gradient Boosting Machine",
		"GBM",
		"K-Nearest Neighbors",
		"KNN",
		"Naive Bayes",
		"K-Means Clustering",
		"Principal Component Analysis",
		"PCA",
		"Bayesian Networks",

		// Natural Language Processing (NLP)
		"Text Analysis",
		"Sentiment Analysis",
		"Speech Recognition",
		"Machine Translation",
		"Language Model",
		"Transformer",
		"BERT",
		"Bidirectional Encoder Representations from Transformers",
		"GPT",
		"Generative Pre-trained Transformer",
		"Tokenization",
		"Named Entity Recognition",
		"NER",
		"Part-of-Speech Tagging",
		"Lemmatization",
		"Stemming",
		"Chatbot",
		"Dialog System",
		"Language Understanding",
		"Word Embeddings",
		"Sentence Embeddings",

		// Computer Vision
		"Image Recognition",
		"Object Detection",
		"Image Segmentation",
		"Face Recognition",
		"Facial Landmark Detection",
		"Image Classification",
		"Image Processing",
		"Optical Character Recognition",
		"OCR",
		"Autonomous Vehicles",
		"Scene Understanding",
		"Augmented Reality",
		"AR",
		"Virtual Reality",
		"VR",
		"Generative Adversarial Networks",
		"GANs",
		"Image Synthesis",

		// AI Infrastructure & Tools
		"TensorFlow",
		"PyTorch",
		"Scikit-Learn",
		"Keras",
		"OpenCV",
		"Theano",
		"Jupyter Notebook",
		"CUDA",
		"GPU",
		"Graphics Processing Unit",
		"TPU",
		"Tensor Processing Unit",
		"Cloud AI",
		"Edge AI",
		"API",
		"Application Programming Interface",
		"Data Pipeline",
		"Data Preprocessing",
		"Model Deployment",
		"MLOps",
		"Machine Learning Operations",
		"AutoML",
		"Data Augmentation",

		// AI Applications
		"Self-Driving Cars",
		"Autonomous Systems",
		"Virtual Assistant",
		"Smart Home",
		"Smart City",
		"Fintech AI",
		"Healthtech AI",
		"Medtech AI",
		"Edtech AI",
		"AI in Finance",
		"AI in Healthcare",
		"AI in Retail",
		"AI in Manufacturing",
		"AI in Marketing",
		"AI in Security",
		"AI in Agriculture",
		"AI in Education",

		// AI Companies & Startups
		"AI Startup",
		"Tech Company",
		"Innovation",
		"Disruptive Technology",
		"AI Research Lab",
		"AI Hub",
		"AI Ecosystem",
		"Venture Capital",
		"Investment in AI",
		"AI Funding",
		"AI Acquisition",
		"AI Partnership",

		// AI Challenges & Ethical Concerns
		"Bias in AI",
		"Fairness",
		"Transparency",
		"Explainability",
		"Accountability",
		"AI Safety",
		"AI Governance",
		"AI Regulation",
		"Privacy Concerns",
		"Data Security",
		"Ethical AI",
		"AI for Social Good",

		// Emerging AI Trends
		"Explainable AI",
		"XAI",
		"Federated Learning",
		"Quantum Computing",
		"AI for IoT",
		"Internet of Things",
		"AI for 5G",
		"Human-AI Collaboration",
		"AI in the Cloud",
		"AI at the Edge",
		"AI for Sustainability",
		"AI in Climate Change",
		"AI in Drug Discovery",
		"Synthetic Data",

		// Practical Use Cases
		"Fraud Detection",
		"Recommendation Systems",
		"Personalization",
		"Customer Service AI",
		"Predictive Maintenance",
		"Supply Chain Optimization",
		"Energy Management",
		"Cybersecurity AI",
		"AI-Driven Analytics",
		"Process Automation",
		"AI-Powered Search",
	];

	let aiCompanyArticles = [];

	feed.items.forEach((item) => {
		const title = item.title.toLowerCase();
		const description = (
			item.contentSnippet ||
			item.content ||
			""
		).toLowerCase();

		// Check if the title or description contains any AI-related keywords
		const isAiRelated = aiKeywords.some(
			(keyword) =>
				title.includes(keyword.toLowerCase()) ||
				description.includes(keyword.toLowerCase())
		);

		if (isAiRelated) {
			aiCompanyArticles.push({
				title: item.title,
				link: item.link,
				pubDate: item.pubDate,
				description: item.contentSnippet || item.content,
			});
		}
	});

	// Output or further process the AI company articles
	console.log(`Found ${aiCompanyArticles.length} AI-related articles:`);
	aiCompanyArticles.forEach((article) => {
		console.log(`- ${article.title} (${article.pubDate})`);
		console.log(`  Link: ${article.link}`);
	});

	return aiCompanyArticles;
}

async function findArticlesFromFeed() {
	var aiCompanyArticles = [];
	for (const feedUrl of RSSFeeds) {
		try {
			var article = await getAiCompanyArticles(feedUrl);
			aiCompanyArticles.push(article);
		} catch (error) {
			console.error(`Error fetching articles from ${feedUrl}:`, error);
		}
	}
	var flatList = aiCompanyArticles.flat();
	console.log("Flat list of AI articles:", flatList);

	var articleLinks = flatList.map((article) => article.link);
	console.log("Article links:", articleLinks);
	console.log(articleLinks[0]);
	readArticleFromLink(articleLinks[0]);
	return aiCompanyArticles;
}
function removeUnwantedSections(text) {
	// Define keywords or patterns that are typically found in non-article content
	const unwantedPatterns = [
		/Related articles:/i,
		/More stories from/i,
		/You might also like/i,
		/Advertisement/i,
		/Next article/i,
		/More TechCrunch/i,
	];

	// Remove any lines that match the patterns
	unwantedPatterns.forEach((pattern) => {
		text = text
			.split("\n")
			.filter((line) => !pattern.test(line))
			.join("\n");
	});

	return text;
}
async function readArticleFromLink(link) {
	try {
		const { data } = await axios.get(link);
		const dom = new JSDOM(data, { url: link });
		const reader = new Readability(dom.window.document);
		const article = reader.parse();
		console.log("ARTICLE DATA:");
		// console.log(
		// 	removeUnwantedSections(article.textContent)
		// 		.split(/\s{2,}/g)
		// 		.join(" ")
		// 		.trim()
		// );

		// extractCompanyData(
		// 	removeUnwantedSections(article.textContent)
		// 		.split(/\s{2,}/g)
		// 		.join(" ")
		// 		.trim()
		// );
		console.log("Link:" + link + "\nWebsite: " + article.textContent);
		extractCompanyData(
			"Link:" + link + "\nWebsite: " + article.textContent
		);
	} catch (error) {
		console.error(`Error reading article from ${link}:`, error);
	}
}
// async function readArticleFromLink(link) {
// 	const { data } = await axios.get(link);
// 	console.log("ARTICLE DATA:");
// 	//console.log(data);
// 	const $ = cheerio.load(data);
// 	// Function to check if an element is visible
// 	function isVisible(element, $) {
// 		const style = $(element).css(["display", "visibility"]);
// 		return style.display !== "none" && style.visibility !== "hidden";
// 	}

// 	// Function to recursively extract visible text
// 	function extractVisibleText($, element) {
// 		let text = "";

// 		$(element)
// 			.contents()
// 			.each((i, el) => {
// 				if (el.type === "text") {
// 					// If it's a text node, add its text content
// 					text += $(el).text().trim() + " ";
// 				} else if (el.type === "tag" && isVisible(el, $)) {
// 					// If it's an element node and it's visible, recursively extract text
// 					text += extractVisibleText($, el) + " ";
// 				}
// 			});

// 		return text.trim();
// 	}
// 	function findLargestTextBlock($) {
// 		let largestBlock = "";
// 		let maxLength = 0;

// 		$("body *").each((i, el) => {
// 			if (isVisible(el, $)) {
// 				const content = $(el).text().trim();
// 				if (content.length > maxLength) {
// 					maxLength = content.length;
// 					largestBlock = content;
// 				}
// 			}
// 		});

// 		return largestBlock
// 			.split(/\s{2,}/g)
// 			.join(" ")
// 			.trim();
// 	}
// 	// Extract the article content from the HTML
// 	const articleContent = findLargestTextBlock($);

// 	// Output the article content
// 	console.log(articleContent);
// }

console.log(process.env["apiKey"]);
const client = new OpenAI({
	apiKey: process.env.apiKey,
});

async function getModels() {
	var list_models = await client.models.list();
	console.log(list_models.body.data);
}
getModels();

// var mediaData = {
// 	"Media Outlet": [
// 		"TechCrunch",
// 		"Wired",
// 		"MIT Technology Review",
// 		"VentureBeat",
// 		"The Verge",
// 		"Forbes",
// 		"Business Insider",
// 		"Fast Company",
// 		"ZDNet",
// 		"CNET",
// 		"Bloomberg Technology",
// 		"Reuters Technology News",
// 		"BBC Tech News",
// 		"Ars Technica",
// 		"CNBC Technology",
// 		"Engadget",
// 		"Gizmodo",
// 		"The New York Times Technology",
// 		"The Wall Street Journal Technology",
// 		"IEEE Spectrum",
// 	],
// 	URL: [
// 		"https://techcrunch.com",
// 		"https://www.wired.com",
// 		"https://www.technologyreview.com",
// 		"https://www.venturebeat.com",
// 		"https://www.theverge.com",
// 		"https://www.forbes.com",
// 		"https://www.businessinsider.com",
// 		"https://www.fastcompany.com",
// 		"https://www.zdnet.com",
// 		"https://www.cnet.com",
// 		"https://www.bloomberg.com/technology",
// 		"https://www.reuters.com/news/technology",
// 		"https://www.bbc.com/news/technology",
// 		"https://www.arstechnica.com",
// 		"https://www.cnbc.com/technology",
// 		"https://www.engadget.com",
// 		"https://www.gizmodo.com",
// 		"https://www.nytimes.com/section/technology",
// 		"https://www.wsj.com/news/technology",
// 		"https://www.spectrum.ieee.org",
// 	],
// 	"Twitter Handle": [
// 		"@TechCrunch",
// 		"@WIRED",
// 		"@techreview",
// 		"@VentureBeat",
// 		"@verge",
// 		"@Forbes",
// 		"@businessinsider",
// 		"@FastCompany",
// 		"@ZDNet",
// 		"@CNET",
// 		"@technology",
// 		"@ReutersTech",
// 		"@BBCTech",
// 		"@arstechnica",
// 		"@CNBCtech",
// 		"@engadget",
// 		"@Gizmodo",
// 		"@nytimes",
// 		"@WSJTech",
// 		"@IEEESpectrum",
// 	],
// };

// const MODEL = "gpt-4o-mini-2024-07-18";

// var GptOptions = function (messages) {
// 	this.temperature = 0.5;
// 	this.model = MODEL;
// };

// // properties is an array of strings

var companyProperties = [
	"name",
	"description",
	"url",
	"country",
	"state",
	"city",
	"founded_year",
	"funding",
	"status",
	"sector",
	"industry",
	"sub_industry",
	"target",
	"date_updated",
	"ceo",
];

async function extractCompanyData(unfilteredText) {
	var prompt =
		"Extract the article relevant to the link from the given website text: \n";
	prompt += unfilteredText;
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
	console.log("Extracted Article: " + textContent);
	prompt =
		"Extract the following data from the given text and output the found data as a JSON object, if you find multiple companies in the article, make a JSON object for each company: \n";
	for (var i = 0; i < companyProperties.length; i++) {
		prompt += companyProperties[i] + ", ";
	}
	prompt = prompt.substring(0, prompt.length - 2);
	prompt += ".";
	prompt += "\n\nText: " + textContent;
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
	console.log(response.choices[0].message.content);
}

// var Company = function () {
// 	for (var i = 0; i < companyProperties.length; i++) {
// 		this[companyProperties[i]] = "";
// 	}
// };

// Company.prototype.extractProperties = function (obj) {
// 	for (var i = 0; i < companyProperties.length; i++) {
// 		if (obj[companyProperties[i]]) {
// 			this[companyProperties[i]] = obj[companyProperties[i]];
// 		}
// 	}
// };
// var currentURL = 0;
// async function () {
// 	// every five minutes query a url from the mediaData object
// 	// tell it to find news related to ai companies. Then tell it to find the necessary data to fill in the company object
// 	// tell it to output the data as a JSON object string

// 	var company = new Company();

// 	var prompt = "Find news related to AI companies from ";

// 	var url = mediaData.URL[currentURL];
// 	prompt += url + " using the following keywords: ";
// 	for (var i = 0; i < companyProperties.length; i++) {
// 		prompt += companyProperties[i] + ", ";
// 	}
// 	prompt = prompt.substring(0, prompt.length - 2);
// 	prompt += ".";
// 	console.log(prompt);
// 	var messages = [prompt];
// 	var response = await client.chat.completions.create({
// 		model: "gpt-4o",
// 		messages: [
// 			{
// 				role: "system",
// 				content:
// 					"You are a journalist looking for news related to AI companies.",
// 			},
// 			{ role: "user", content: prompt },
// 		],
// 	});
// 	console.log(response.choices[0].message.content);
// 	currentURL++;
// 	if (currentURL == mediaData.URL.length) {
// 		currentURL = 0;
// 	}
// }
