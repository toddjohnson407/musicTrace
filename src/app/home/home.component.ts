import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomeService } from './home.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, from, of, combineLatest, empty } from 'rxjs';
import { concatMap, expand, takeWhile, takeLast } from 'rxjs/operators';

class Playlist {
  constructor(
    public title: string,
    public tracks: Array<Object>
  ) { }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** The user access token retrieved from Spotify api */
  accessToken: string;
  /** The user refresh token retrieved from Spotify api */
  refreshToken: string;
  /** The Spotify user object */
  spotifyUser: Object;
  /** Raw Spotify playlists data associated with a user */
  playlistsData: Array<any>;
  /** Formatted playlists from playlistsData */
  playlists: Array<Playlist>;

  constructor(
    private route: ActivatedRoute,
    private homeService: HomeService,
    private fb: FormBuilder
  ) {
    this.playlists = [];
  }

  ngOnInit() {
    this.refreshToken = this.homeService.refreshToken;
    console.log(this.refreshToken);
    if (this.refreshToken) {
      this.homeService.accessToken(this.refreshToken).subscribe((token: any) => {
        this.accessToken = token['access_token'] || null;
        this.getPlaylists();
      });
    } else {
      this.route.queryParams.subscribe((params: Params) => {
        if (params && params['code']) this.getTokens(params.code);
        else this.authorizeUser();
      });
    }
  }

  /** Retrieves access and refresh tokens from Spotify api */
  getTokens(code: string) {
    this.homeService.spotifyTokens(code).subscribe((res: any) => {
      console.log('tokens', res);
      this.accessToken = res.access_token || null;
      this.refreshToken = res.refresh_token || null;
      if (this.refreshToken) this.homeService.refreshToken = this.refreshToken;
      if (res && res.error) window.open('http://localhost:5000', '_self');
      // if (res && res.error) console.log(res.error);
      this.getPlaylists();
    })
  }

  /** Calls service to make Spotify user auth api call */
  authorizeUser() {
    console.log('YAY');
    this.homeService.spotifyAuth().subscribe((url: any) => { 
      if (url && (typeof url === 'string')) window.open(url, '_self')
    });
  }

  /**
   * Gets Spotify user data via access token retrieved from
   * the Spotify api token endpoint
   */
  getUser(): void {
    if (this.accessToken) this.homeService.spotifyUser(this.accessToken).subscribe((res: any) => {
      if (res) {
        this.spotifyUser = res;
        this.getPlaylists();
      }
    });
  }

  /**
   * Gets Spotify user playlists data via access token retrieved
   * from the Spotify api token endpoint
   */
  getPlaylists(): void {
    if (this.accessToken) {
      this.homeService.spotifyPlaylists(this.accessToken).subscribe((playlistsData: Array<Object>) => {
        this.playlistsData = playlistsData;
        from(this.playlistsData).pipe(
          concatMap((playlist: any) => { return combineLatest(this.homeService.playlistTracks(this.accessToken, playlist.id), of(playlist.name))})
        ).subscribe(([tracks, title]) => {
            this.playlists.push(new Playlist(title, tracks));
            if (this.playlists.length === this.playlistsData.length) this.formatPlaylists();
          });
      });
      // this.homeService.spotifyPlaylists(this.accessToken).pipe(
      //   expand((playlistsData: any) => {
      //     totalPlaylistData = totalPlaylistData.concat(playlistsData.items)
      //     if (playlistsData.items && playlistsData.items.length < 20) return of(totalPlaylistData);
      //     if (playlistsData.next) return this.homeService.spotifyPlaylists(this.accessToken, playlistsData.offset + 20);
      //     return empty()
      //   }),
      //   takeLast(1)
      // )
      // .subscribe((playlists: Array<any>) => {
      //   if (playlists) this.playlistsData = playlists;
      //   console.log(this.playlistsData);
      //   from(this.playlistsData).pipe(
      //     concatMap((playlist: any) => this.getTracks(playlist))
      //   ).subscribe((playlist: Playlist) => {
      //       this.playlists.push(playlist);
      //       if (this.playlists.length === this.playlistsData.length) this.formatPlaylists();
      //     });
      // });
    }
  }

  // /** Gets tracks recursively from playlist using next attribute */
  // getTracks(playlist: any): Observable<Playlist> {
  //   let totalTracks = [];
  //   return this.homeService.playlistTracks(this.accessToken, playlist.id).pipe(
  //     expand(tracks => {
  //       totalTracks = totalTracks.concat(tracks.items)
  //       if (tracks.items && tracks.items.length < 100) return of(new Playlist(playlist.name, totalTracks));
  //       if (tracks.next) return this.homeService.playlistTracks(this.accessToken, playlist.id);
  //       return empty()
  //     }),
  //     takeLast(1)
  //   );
  // }

  /** Formats playlists */
  formatPlaylists(): void {
    console.log(this.playlists);
    let ids = [];

    this.playlists[0].tracks.forEach((track: any) => ids.push(track.track.id));
    let idGroups = []
    for (let i = 0; i < ids.length / 50; i++) {
      let group = ids.slice(i*50, i*50 + 50);
      // let group = ids.slice(i*10, i*10 + 10);
      // console.log(group.length);
      idGroups.push(group);
      // if (i < 2) idGroups.push(group.join(','));
      // if (i < 2) idGroups.push(group);
    }
    console.log(idGroups);
    idGroups = idGroups.slice(140);
    from(idGroups).pipe(
      concatMap(group => this.homeService.saveTracks(this.accessToken, group))
    ).subscribe(res => {
      // console.log(res);
    })
  }
}
