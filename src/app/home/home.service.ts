import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

import { CookieService } from 'ngx-cookie-service';


@Injectable({
  providedIn: 'root'
})

export class HomeService {

  /** Endpoint for spotify related api requests */
  spotifyEndpoint: string = 'api/spotify/';
  /** Refresh token for Spotify authorization stored in a cookie */
  _refreshToken: string;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) { }


  /** Getter and Setter for the Spotify refresh token from cookie */
  set refreshToken (value: string) { this._setRefreshTokenCookie(value) }
  get refreshToken () { return this._refreshToken || this._retrieveRefreshToken()  }

  /** Helper method to retrieve Spotify refresh token from cookie */
  _retrieveRefreshToken(): string {
    this._refreshToken = this.cookieService.get('rfrs-tkn');
    return this._refreshToken;
  }

  /** Helper method to set Spotify refresh token cookie value */
  _setRefreshTokenCookie(value: string): void {
    this.cookieService.set('rfrs-tkn', value);
    this._refreshToken = this.cookieService.get('rfrs-tkn');
  }


  /** Sends data to server to make Spotify api auth call */
  spotifyAuth(): Observable<any> {
    return this.http.get<any>(this.spotifyEndpoint + 'login');
  }

  /** Sends auth code to Spotify api to retrieve tokens */
  spotifyTokens(authCode: string): Observable<any> {
    return this.http.get<any>(this.spotifyEndpoint + 'tokens/' + authCode);
  }

  /** Sends auth code to Spotify api to retrieve access token */
  accessToken(refreshToken: string): Observable<any> {
    return this.http.get<any>(this.spotifyEndpoint + 'access-token/' + refreshToken);
  }

  /** Sends access token to Spotify api to retrieve user data */
  spotifyUser(accessToken: string): Observable<any> {
    return this.http.get<any>(this.spotifyEndpoint + 'user/' + accessToken);
  }

  /** Sends access token to Spotify api to retrieve user playlists */
  spotifyPlaylists(accessToken: string): Observable<any> {
    return this.http.get<any>(this.spotifyEndpoint + 'playlists/' + accessToken);
  }

  /** Sends access token to Spotify api to retrieve user playlists */
  playlistTracks(accessToken: string, playlistId: string): Observable<any> {
    return this.http.get<any>(`${this.spotifyEndpoint}playlist-tracks/${accessToken}/${playlistId}`);
  }

  /** Saves tracks to user library by id */
  saveTracks(accessToken: string, ids: any): Observable<any> {
    return this.http.post<any>(`${this.spotifyEndpoint}savetracks/${accessToken}`,
      { ids: ids }
    );
  }


}
