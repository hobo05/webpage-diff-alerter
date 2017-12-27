#!/usr/bin/env node

'use strict'

require('dotenv').config()

var Promise = require("bluebird");
var request = require('request-promise')
var cheerio = require('cheerio')
var fs = Promise.promisifyAll(require("fs"));
var sendemail = require('sendemail')
var email = Promise.promisify(sendemail.sendMany)
require('colors')
var jsdiff = require('diff');
var _ = require('lodash/lang');

function scrapeText(scrapeOptions, selector) {
	return request(scrapeOptions)
    	.then($ => $(selector).text().trim()) // Extract text
}

function writeScrapeTextToFile(scrapeOptions, selector, file) {
	return scrapeText(scrapeOptions, selector)
	    .then(text => fs.writeFileAsync(file, text, 'utf8'))	// output to file
}

function compareResults(scrapeOptions, alertEmailOptions, selector, compareTextUrl) {

	var getExistingText = request(compareTextUrl)

	return Promise.all([getExistingText, scrapeText(scrapeOptions, selector)])
		.spread(function(existingText, scrapedText) {
			if (scrapedText !== existingText) {
				console.log("Scraped text has changed! Here is the diff:")
				printDiff(existingText, scrapedText)
				console.log(`Sending alert with options=${JSON.stringify(alertEmailOptions)}!`)
				email(alertEmailOptions)
			} else {
				console.log("No changes to scraped text")
			}
		})
}

function printDiff(expected, actual) {
	var diff = jsdiff.diffChars(expected, actual);
 
	diff.forEach(function(part){
	  // green for additions, red for deletions
	  // grey for common parts
	  var color = part.added ? 'green' :
	    part.removed ? 'red' : 'grey';
	  process.stderr.write(part.value[color]);
	});
	console.log()
}

function logAndSendError(errorEmailOptions, err) {
	console.error(err)
	let options = _.cloneDeep(errorEmailOptions)
	options.context.error = err
	email(options)
		.catch(err => console.log(err))
}

var argv = require('yargs')
	.usage('Usage: $0 [options]')
	.option('alert', {
		alias: 'a',
		describe: 'Name of the alert'
	})
	.option('URL', {
		alias: 'u',
		describe: 'URL to monitor'
	})
	.option('selector', {
		alias: 's',
		describe: 'CSS selector for the text'
	})
	.option('compare-url', {
		alias: 'c',
		describe: 'URL to the file you wish to compare for changes'
	})
	.option('emails', {
		alias: 'e',
		describe: 'Comma-delimited emails to recieve the alerts'
	})
	.option('error-emails', {
		alias: 'x',
		describe: 'Comma-delimited emails to recieve the errors'
	})
	.option('file', {
		alias: 'f',
		describe: 'Output filename for text extraction',
		default: 'output.txt'
	})
	.option('mode', {
		alias: 'm',
		describe: 'the different operating modes. "extract" will output the extracted text to output.txt and "compare" will compare extracted text with the file provided',
		choices: ['extract', 'compare']
	})
	.coerce({
		emails: value => value.split(','),
		'error-emails': value => value.split(',')
	})
	.demandOption(['alert','URL','selector','mode'])
	.check((argv, options) => {
		if (argv.mode == "compare" && argv['compare-url'] == undefined) {
			throw new Error('Error: If mode=compare, compare-url must be defined')
		}
		if (argv.mode == "compare" 
			&& (argv.emails == undefined || argv['error-emails'] == undefined)) {
			throw new Error('Error: If mode=extract, please specify "emails" and "error-emails"')
		}
		return true
	})
	.help()
	.argv

console.log(argv)

var scrapeOptions = {
    uri: argv.URL,
    transform: function (body) {
        return cheerio.load(body)
    }
};

var alertEmailOptions = {
	templateName: 'alert',
	context: {
	  url: argv.URL
	},
	subject: argv.alert,
	toAddresses: argv.emails
};

var errorEmailOptions = {
	templateName: 'error',
	context: {
	  alert: argv.alert
	},
	subject: `Error for ${argv.alert}`,
	toAddresses: argv['error-emails']
};


if (argv.mode == "extract") {
	writeScrapeTextToFile(scrapeOptions, argv.selector, argv.file)
		.then(() => console.log(`Outputted scraped text to ${argv.file}`))
		.catch(err => logAndSendError(errorEmailOptions, err))
} else if (argv.mode == "compare") {
	compareResults(scrapeOptions, alertEmailOptions, argv.selector, argv['compare-url'])
		.catch(err => logAndSendError(errorEmailOptions, err))
}
