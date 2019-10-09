/*
 * this is the api router. It handles requests from the Angular client
 * to /api/*
 *
 * this router handles any request made to the api, and routes them to more specific
 * routers
 *
 * uri's are relative to /api/
 * so '/api/spotify' looks like '/spotify' here
 */
const express = require('express');
const router = express.Router();

//use a separate router for requests that are specifically related the spotify api
const spotify = require('./spotify/spotify.js');
router.use('/spotify', spotify);

module.exports = router;
