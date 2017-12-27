# webpage-diff-alerter
checks if a webpage changes or not

## Features
* Fully configurable CLI
* Compares a portion of the webpage with a hosted file

## Technologies
* [Node.js](https://nodejs.org) - Server-side Javascript
* [NPM](https://www.npmjs.com/) - Node package manager
* [Mustache on Express](https://www.npmjs.com/package/mustache-express) - Templating language
* [Blue Bird](http://bluebirdjs.com/) - Feature-rich Promise library
* [Lodash](https://lodash.com/) - JS Utility library
* [Request](https://github.com/request/request) - Simplified HTTP request client
* [yargs](http://yargs.js.org/) - parse optstrings
* [sendemail](https://github.com/dwyl/sendemail) - Send email using AWS SES (Simple Email Service)

## How it works

### Scraping
1. Loads the webpage provided
2. Selects the DOM element using the CSS selector
3. Extracts the text from that element
4. (Optional) Writes the text to a file for future comparison

### Comparison
1. Loads a hosted file with the text to compare
2. Compares the scraped text with the hosted text
3. Sends an alert if the text differs from each other


## How to run it locally
1. Clone the repo

	```bash
	$ git clone https://github.com/hobo05/webpage-diff-alerter.git
	$ cd webpage-diff-alerter.git
	$ cp .env-example .env
	```
2. Open up .env
3. Update the various fields. See <https://github.com/dwyl/sendemail> for directions
4. Install the dependencies and run the help command


	```bash
	$ npm install
	$ npm run help
	```
5. You should see the following usage

	```bash
	Usage: index [options]
	
	Options:
	  --version           Show version number                              [boolean]
	  --alert, -a         Name of the alert                               [required]
	  --URL, -u           URL to monitor                                  [required]
	  --selector, -s      CSS selector for the text                       [required]
	  --compare-url, -c   URL to the file you wish to compare for changes
	  --emails, -e        Comma-delimited emails to recieve the alerts
	  --error-emails, -x  Comma-delimited emails to recieve the errors
	  --file, -f          Output filename for text extraction[default: "output.txt"]
	  --mode, -m          the different operating modes. "extract" will output the
	                      extracted text to output.txt and "compare" will compare
	                      extracted text with the file provided
	                                      [required] [choices: "extract", "compare"]
	  --help              Show help                                        [boolean]
	```
6. Run with extract mode to get the baseline text

	```bash
	$ node index -a "Test Alert" -u "http://localhost:8000?q=1234" -s "div#someid>h2" -f extracted.txt -m extract
	```
7. Upload the text somewhere like dropbox, pastebin, AWS S3, etc...
8. Run with comparison mode to check if the text has changed

	```bash
	$ node index -a "Test Alert" -u "http://localhost:8000?q=1234" -s "div#someid>h2" -c "https://s3.amazonaws.com/my-s3-bucket/extracted.txt" -e "my@email.com,his@email.com" -x "errors@mail.com" -m compare
	```
9. You can simply set a cron job on your local server/machine to check for changes

## How to run it in Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

1. After performing the local setup and seeing that everything works, sign up for Heroku on the free plan with the button above
2. Follow the tutorial for [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs) if you don't know how Heroku works
3. Create a new Heroku app from your project root
4. Install <https://github.com/xavdid/heroku-config> and push your .env settings to heroku
5. Run the following commands to do one-off runs on heroku 

	```bash
	$ git push heroku master
	$ heroku run 'node index -a "Test Alert" -u "http://localhost:8000?q=1234" -s "div#someid>h2" -c "https://s3.amazonaws.com/my-s3-bucket/extracted.txt" -e "my@email.com,his@email.com" -x "errors@mail.com" -m compare'
	```
6. Use the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) to run it periodically to check for changes
