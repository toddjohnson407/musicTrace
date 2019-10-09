/**
 * This is the router used to interact with the Spotify api
 * handles the request from Angular to 'api/spotify'
 */
const express = require('express');
const querystring = require('querystring');
const router = express.Router();
const fetch = require('node-fetch');
const { generateRandomString } = require('../helpers/helpers');

const client_id = 'eb772d6bc8b44a0783ce3872178f44f4'; // Spotify client id
const client_secret = 'a12f836d56624cad90af8e27522c1e0e'; // Spotify secret
const redirect_uri = 'http://localhost:5000'; // Spotify redirect uri
const stateKey = 'spotify_auth_state';

/**
 * Retrieves all playlists owned or followed by a user from the Spotfiy api
 * 
 * @param {accesstoken} string   the access token used to access the tracks of the playlist
 * 
 * @return {Object}     Object   an object containing a list of all a user's playlists
 */
router.get('/playlists/:accesstoken', (req, res) => {

  let { accesstoken } = req.params
  let totalPlaylists = [];
  
  let getPlaylists = (offset = 0) => {
    let query = querystring.stringify({ scope: 'playlist-read-private playlist-read-collaborative', offset: parseInt(offset) });
    fetch(`https://api.spotify.com/v1/me/playlists?${query}`, {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + accesstoken }
    }).then(res => res.json())
      .then(playlists => {
        totalPlaylists = totalPlaylists.concat(playlists.items)
        if (playlists.items && playlists.items.length < 20) return res.status(200).json(totalPlaylists)
        if (playlists.next) return getPlaylists(playlists.offset + 20)
      })
      .catch(error => console.log('Playlists Retrieval Error:', error));
  }

  try { getPlaylists() } catch(err) { res.status(500).json("SPOTIFY USER'S PLAYLISTS RETRIEVAL ERROR" + err) }

});

/**
 * Retrieves tracks from a given playlist in lists of 100 or less
 * 
 * @param {playlistid}  string   the id of the playlist where the tracks are being retrieved
 * @param {accesstoken} string   the access token used to access the tracks of the playlist
 * 
 * @return {Object}     Object   an object containing a list of tracks in a playlist
 */
router.get('/playlist-tracks/:accesstoken/:playlistid', (req, res) => {

  let { accesstoken, playlistid } = req.params;
  let allTracks = [];
  
  let getPlaylistTracks = (offset = 0) => {
    fetch(`https://api.spotify.com/v1/playlists/${playlistid}/tracks?` +  querystring.stringify({ offset: parseInt(offset) }), {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + accesstoken }
    }).then(res => res.json())
      .then(tracks => {
        allTracks = allTracks.concat(tracks.items);
        if (tracks.items && tracks.items.length < 100) return res.status(200).json(allTracks)
        if (tracks.next) return getPlaylistTracks(tracks.offset + 100)
        res.status(200).json(tracks)
      })
      .catch(error => console.log('Playlist Offset Retrieval Error:', error));
  }

  try { getPlaylistTracks() } catch(err) { res.status(500).json("SPOTIFY USER'S PLAYLIST OFFSET TRACKS RETRIEVAL ERROR" + err) }

});


/**
 * Gets the Spotify user info object from the Spotify api
 * 
 * @param {accesstoken} string  the access token used to access a user's data

 * @return {Object}     Object  the Spotify user object
 */
router.get('/user/:accesstoken', (req, res) => {

  let accessToken = req.params.accesstoken;

  let getUser = () => {
    fetch('https://api.spotify.com/v1/me', {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    }).then(res => res.json())
      .then(body => res.status(200).json(body))
      .catch(error => console.log('User Retrieval Error:', error));

  }

  try { getUser() } catch(err) { res.status(500).json("SPOTIFY USER RETRIEVAL ERROR" + err) }

});


/**
 * Spotify login api route for authorizing a user
 */
router.get('/login', (req, res) => {
  
	let state = generateRandomString(16);
	let stateKey = 'spotify_auth_state';
	let scopes = 'user-read-private user-read-email';
  
	res.cookie(stateKey, state);

  let fullUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scopes,
    redirect_uri: redirect_uri,
    state: state
  });
  console.log(fullUrl);

  res.status(200).json(fullUrl);

});


/** 
 * Sends client data to start Spotify user authentication
 * 
 * 200 - success
 * 500 - server error
 * 
 * @param {code}      string   code retrieved from spotify auth api call
 * 
 * @return {Object}   Object   refresh and access tokens in an object
 */
router.get('/tokens/:code', (req, res) => {

  const { code } = req.params

  const tokensBody = {
    code: code,
    redirect_uri: redirect_uri,
    grant_type: 'authorization_code',
    client_id: client_id,
    client_secret: client_secret
  }

  let tokenParams = new URLSearchParams();
  Object.entries(tokensBody).forEach(([key, value]) => tokenParams.append(key, value));

  let getTokens = () => {
    fetch('https://accounts.spotify.com/api/token', {
      method: 'post',
      body: tokenParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(res => res.json())
      .then(body => res.status(200).json(body))
      .catch(error => console.log('Tokens Retrieval Error:', error));
  }
  try { getTokens() } catch(err) { res.status(500).json("TOKENS RETRIEVAL ERROR" + err) }
});

/** 
 * Sends a refresh token to retrieve a new access token
 * 
 * 200 - success
 * 500 - server error
 * 
 * @param {refreshtoken} string   refresh token stored in client side cookie
 * 
 * @return {Object} Object        access token in an object
 */
router.get('/access-token/:refreshtoken', (req, res) => {

  const { refreshtoken } = req.params

  const tokenBody = {
    refresh_token: refreshtoken,
    grant_type: 'refresh_token'
  }

  let tokenParams = new URLSearchParams();
  Object.entries(tokenBody).forEach(([key, value]) => tokenParams.append(key, value));

  let getToken = () => {
    fetch('https://accounts.spotify.com/api/token', {
      method: 'post',
      body: tokenParams,
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(res => res.json())
      .then(body => res.status(200).json(body))
      .catch(error => console.log('Token Retrieval Error:', error));
  }
  try { getToken() } catch(err) { res.status(500).json("TOKEN RETRIEVAL ERROR" + err) }
});

module.exports = router;
