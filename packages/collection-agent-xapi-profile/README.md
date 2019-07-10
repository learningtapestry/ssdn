# SSDN Browser Collection Agent xAPI Profile

The data model for the xAPI data collected in the browser agent is very simple.

We collect two types of events: 

- Heartbeat, for browser visits. The browser periodically sends an event, using the xAPI verb `heartbeat`, to indicate that it is active. A session's duration can be tracked by aggregating events with the same `heartbeatId`.
- Video interactions that happen in the browser. We're collecting messages with the `played` and `paused` verbs.

See [ssdn-collection-agent.jsonld](ssdn-collection-agent.jsonld) for the heartbeat profile.

See [video.jsonld](https://github.com/adlnet/xapi-authored-profiles/blob/d23d1b5f34e107cb877c859d1fc920e9d28e0784/video/v1.0.3/video.jsonld) for the video profile.

## Example messages

Heartbeat:

```json
{
   "actor":{
      "account":{
         "name":"test@example.com",
         "homePage":"https://example.com"
      },
      "objectType":"Agent"
   },
   "context":{
      "extensions":{
         "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/heartbeatId":"623d6ae6-fa11-41a4-9c94-189def768792",
         "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/pageTitle":"Document",
         "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/timeSpentOnPage":2
      }
   },
   "object":{
      "definition":{
         "type":"https://learningtapestry.github.io/xapi/ssdn/collection/activities/page"
      },
      "id":"http://localhost:1234/",
      "objectType":"Activity"
   },
   "verb":{
      "id":"https://learningtapestry.github.io/xapi/ssdn/collection/verbs/heartbeat"
   }
}
```

Video:

```json
{
   "actor":{
      "account":{
         "name":"test@example.com",
         "homePage":"https://example.com"
      },
      "objectType":"Agent"
   },
   "object":{
      "definition":{
         "type":"https://w3id.org/xapi/video/activity-type/video"
      },
      "id":"https://www.youtube.com/watch?t=111&v=I6xQtFsODIQ",
      "objectType":"Activity"
   },
   "verb":{
      "id":"https://w3id.org/xapi/video/verbs/played"
   }
}
```
