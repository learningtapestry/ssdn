# Nucleus Browser Collection Agent xAPI Profile

The data model for the XAPI data collected in the browser agent is very simple.

We collect two types of events: 

- Hearbeat, for browser visits. The browser periodically sends a "heartbeat" event, using the xAPI verb `heartbeat`, to indicate that it is active (a session's duration can be tracked by aggregating heartbeat events with the same `heartbeatId`).
- Video interactions done in the browser. We're collecting messages with the `played` and `paused` verbs.

See [nucleus-collection-agent.jsonld](nucleus-collection-agent.jsonld) for the heartbeat profile.

See [video.jsonld](https://github.com/adlnet/xapi-authored-profiles/blob/d23d1b5f34e107cb877c859d1fc920e9d28e0784/video/v1.0.3/video.jsonld) for the video profile.
