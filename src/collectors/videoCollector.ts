import { Client } from "../client";
import { onDOMContentLoaded } from "../events";
import { VideoMessage } from "../messages";
import { User } from "../user";
import { Collector } from "./collector";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface YtEvent {
  data: number;
  target: {
    getVideoUrl: () => string;
  };
}

/**
 * A collector that tracks user interactions with embedded video, such as
 * YouTube iframes or HTML5 video elements.
 *
 * For the YouTube functionality, it plugs in
 * [YouTube's iframe API](https://developers.google.com/youtube/iframe_api_reference).
 * That requires loading the API script as well as defining a global
 * `onYouTubeIframeAPIReady` handler.
 */
export class VideoCollector implements Collector {
  /**
   * The YouTube API `YT.Player` objects instantiated by the collector.
   * They are accessible in case library users need to control them directly.
   */
  public players: any[] = [];

  /**
   * If a previous `onYouTubeIframeAPIReady` handler had been set, it is
   * preserved in this property.
   */
  private previousYTReady: (() => void) | undefined;

  /**
   * The Nucleus agent client.
   */
  private client: Client;

  /**
   * The Nucleus message user.
   */
  private user: User;

  /**
   * Builds a new `VideoCollector`.
   * @param client The Nucleus agent client.
   * @param user   The Nucleus message user.
   */
  constructor(client: Client, user: User) {
    this.client = client;
    this.user = user;

    if (window.onYouTubeIframeAPIReady) {
      this.previousYTReady = window.onYouTubeIframeAPIReady;
    }

    window.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady.bind(this);
    this.onStateChange = this.onStateChange.bind(this);

    onDOMContentLoaded(() => {
      const ytApiScript = document.createElement("script");
      ytApiScript.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(ytApiScript);

      this.trackHtml5Videos();
    });
  }

  /**
   * The global initialisation handler for the YouTube API.
   * Looks for embedded YT videos and hooks into them for generating Nucleus
   * messages.
   * Every time the video is played, paused, etc, a new message is created and
   * sent to the server.
   */
  public onYouTubeIframeAPIReady() {
    if (this.previousYTReady) {
      this.previousYTReady();
    }

    const iframes = document.getElementsByTagName("iframe");

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < iframes.length; i++) {
      if (iframes[i].src.indexOf("youtube.com") !== -1) {
        // tslint:disable-next-line: no-unused-expression
        this.players.push(
          new window.YT.Player(iframes[i], {
            autoplay: false,
            events: {
              onStateChange: this.onStateChange,
            },
          }),
        );
      }
    }
  }

  private trackHtml5Videos() {
    const videos = document.getElementsByTagName("video");

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      ["playing", "pause", "ended"].forEach((eventType) => {
        video.addEventListener(
          eventType,
          (e) => {
            const target = e.target as any;

            const url = target.currentSrc.match(/^https?/)
              ? target.currentSrc
              : target.baseURI;

            this.trackVideoEvent(eventType, url);
          },
          true,
        );
      });
    }
  }

  private onStateChange(event: YtEvent) {
    let ytState: string;

    switch (event.data) {
      case 5:
        ytState = "cued";
        break;
      case 3:
        ytState = "buffering";
        break;
      case 2:
        ytState = "paused";
        break;
      case 1:
        ytState = "playing";
        break;
      case 0:
        ytState = "ended";
        break;
      case -1:
        ytState = "unstarted";
        break;
      default:
        ytState = "uncertain";
    }

    const blacklist = [-1, 3, 5];
    if (blacklist.includes(event.data)) {
      return;
    }

    this.trackVideoEvent(ytState, event.target.getVideoUrl());
  }

  private trackVideoEvent(state: string, url: string) {
    this.client.sendMessage(
      new VideoMessage(this.user, {
        state,
        videoUrl: url,
      }),
    );
  }
}
