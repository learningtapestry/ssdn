# API usage

## Caliper

The SSDN Caliper endpoint follows the official [IMS Caliper Specification](https://www.imsglobal.org/sites/default/files/caliper/v1p1/caliper-spec-v1p1/caliper-spec-v1p1.html#endpoint).
That means any Sensor agent that is also faithful to the official spec should be able to send data to the SSDN endpoint
without needing any further integration or modification.

Regarding authentication, it integrates with Cognito User Pools to set up an OAuth2 client credentials flow that is able
to generate access bearer tokens. These tokens are suitable to authenticate the endpoint via the `Authorization` HTTP
header.

In order to send a Caliper envelope to your SSDN instance, you must follow these steps:

1. Go to the Cognito User Pools section in the AWS Console, then click on the `App clients` menu entry. From there,
   locate the app client that SSDN should have created for Caliper (it ends with `AppClientCaliper`), and retrieve
   the `App client id` and `App client secret` values. If you prefer, you can create a new app client in the user pool
   and use a different set of credentials.
2. Click on the `Domain name` menu entry and note the Amazon Cognito domain for your instance. By default, SSDN uses
   your instance id as the domain prefix, so assuming your SSDN id is `my-ssdn-instance`, the full domain will be
   something similar to `https://my-ssdn-instance.auth.us-east-1.amazoncognito.com`.
3. You're now ready to obtain an access token that allows access to the Caliper endpoint. Issue a `POST` request to
   `<YOUR-COGNITO-DOMAIN>/oauth2/token` using the client id and secret previously retrieved. Full details on how to
   perform this call are available in the [Cognito documentation for the token endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html).
4. Once you've obtained a temporary access token, issue a `POST` request to the Caliper endpoint using the Caliper JSON
   envelope as the request payload. If you don't know what's the URL for the endpoint, it's available in the API Gateway
   Console as well as the `Settings` section in the SSDN administration panel, under the `ProcessCaliperEnvelopeApi`
   key. Keep in mind that, as defined by the Caliper spec, you must set the token using the `Authorization` header with
   the `Bearer` authentication scheme.
5. The access token will be valid for 1 hour. Should it expire, you can obtain a new one by calling again the
   `/oauth2/token` endpoint.

We've created a Postman [collection](https://www.getpostman.com/collections/363a5cc61893acb145d0) that contains example
calls for both the token endpoint as well as the Caliper endpoint.
