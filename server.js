/**
 * server.js is the entry point to the program. It creates
 * an express server which serves an angular application, interacts with
 * the database, and acts as an api for the angular application.
 */

//imports
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');


//require our api router here
const api = require('./server/api');

///////////////////////////////////////////////////////////////////////
//initialize express application
const app = express();
///////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////
//Middleware
//
// parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//point static path to dist
app.use(express.static(path.join(__dirname, 'dist/')));

//set our api router
app.use('/api', api);

//NOTE: this must be defined after all other routes are defined
//catch all other routes and return the index html file
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist/index.html'));
});
////////////////////////////////////////////////////////////////////////

/**
 * get a port from environment and store in express
 */
const port = process.env.PORT || '3000';
const hostname = '127.0.0.1';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`API running on localhost:${port}`));

//if running in production, listen on the hostname, instead of localhost
// if (!COMMAND_LINE_OPTIONS.developerMode) {
// 	server.listen(port, hostname, () => console.log(`API running on https://${hostname}:${port}`));
// } else {
// 	server.listen(port, () => console.log(`API running on localhost:${port}`));
// }
