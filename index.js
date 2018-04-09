/*
User Story: I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.

User Story: If I pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain an error instead.

User Story: When I visit that shortened URL, it will redirect me to my original link.

--Listen for get
---Search the db to see if the url is there => return it as json
----If it's not in the db, generate a url, add it to db, => return it as json
Make sure two urls aren't the same or INVALID
 */

const express = require('express');
const mongo = require('mongodb').MongoClient;
const validUrl = require('valid-url');

const app = express();
const localUrl = 'http://localhost:8080/'
const url = 'mongodb://localhost:27017'
const dbName = 'urls';
const collName = 'urls';
const port = process.env.PORT || 8080;

const error = function(message) {
	return {error: message};
}

const urlReturn = function(url, newUrl) {
	return {target: url, generatedUrl: newUrl};
}

app.get('/:id', function(req, res) {

	mongo.connect(url, function(err, client) {
		if (err) throw err;

		const collection = client.db(dbName).collection(collName);
		const shortUrl = localUrl + req.params.id;
		collection.findOne({generatedUrl: shortUrl}, function(err, result) {
			if (err) throw err;

			if (result) {
				res.redirect(301, result.target);
			}
			else {
				res.send( {error: 'This URL is not in the database'});
			}
		});
	});
});

app.get('/new/*', function(req, res) {

	if (validUrl.isWebUri(req.params[0])) {
		mongo.connect(url, function(err, client) {
			if (err) throw err;

			const collection = client.db(dbName).collection(collName);
			collection.findOne({target: req.params[0]}, function(err, result) {
				if (err) throw err;

				if (result) {
					res.send(urlReturn(result.target, result.generatedUrl));
				}
				else {  //Generate new URL
					collection.findOneAndUpdate( 
									{nextURL: {$exists: true}}  ,
									{$inc: {nextURL: 1}} , {},
									function(err, result) {
						if (err) throw err;

						const newURL = localUrl + result.value.nextURL;
						

						collection.insert(urlReturn(req.params[0], newURL), function(err, result) {
							if (err) throw err;

							res.send(urlReturn(req.params[0], newURL));
						})

					});
				}
			});

		});
		

	} 
	else {
		res.send(error("Invalid URL."));
	}
});



app.listen(port);