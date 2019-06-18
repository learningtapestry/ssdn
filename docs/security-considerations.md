# Security considerations

## Introduction

In this document, we're trying to describe the major components in the Nucleus application, as well as its interactions,
from the point of view of the security. To achieve that, we'll detail the flow of events that happen in every sub-system
and outline the security measures used in every step.

Whenever possible, references to the actual resource names in the CloudFormation template are provided inside
parenthesis.

## Components

### xAPI event collection & processing

This is perhaps the most important sub-system in the entire Nucleus application, because it covers the vast majority of
components and, thus, interrelates with many security-related aspects.

These are the steps that are involved in the collection and processing of an xAPI event:

**Scenario A**: We assume the collection agent scripts are configured in the web pages that conform the source of the
collection. That means the events will be collected and sent by a script running on a web browser.

1. The collection event scripts call the collection API endpoint (`ProcessXAPIBeaconApi`) whenever a new xAPI event
   needs to be registered.

   - This call is exposed as a `GET` request, mainly because we perform the actual tracking using an
     [image beacon](https://en.wikipedia.org/wiki/Web_beacon). This allows us maximum compatibility with current and old
     browsers, but also means that we're forced to use `GET` requests to send the event information.
   - API keys (`CollectionApiKey`) belonging to an Usage Plan (`CollectionApiUsagePlan`) are set up in order to identify
     the user that is making the request.
   - To avoid exposing the actual API key value in the `GET` request, the collection agent scripts instead send
     the API key identifier that API Gateway generates.
   - The API key identifier is sent as a query parameter. Sending it as a header, as would be the recommended way, would
     make it incompatible with the image beacon approach.

2. Once the collection API endpoint has received the data, it validates the `event` parameter through API Gateway, which
   needs to be sent as part of the query. After that, it delegates the actual work to a Lambda function
   (`ProcessXAPIBeaconFunction`).
3. The event is inserted into a Kinesis data stream (`EventProcessorStream`) by the Lambda function.
4. The event processor stream is configured as the source input to a Kinesis Firehose stream (`EventDeliveryStream`), so
   everything that is put into the data stream is transferred to the Firehose stream.
   - The event processor stream has server-side encryption enabled, so the communication between the streams is
     encrypted.
   - This is an internal process performed by AWS services, so there are no additional security considerations regarding
     the application.

**Scenario B**: We assume the collection is performed by directly calling an API endpoint (`ProcessXAPIStatementApi`).
In this case it's not a web browser that's sending the requests, but an external HTTP client.

1. The client calls the regular **collection API endpoint** (`ProcessXAPIStatementApi`) whenever a new xAPI
   event needs to be registered.

   - In this case we don't have the limitation imposed by the web beacon mechanism, so this call can be executed
     issuing either a `POST` or a `PUT` request.
   - The same API key and usage plan is used here, but now the key is sent using the `x-api-key` header, as is usual.

2. The API Gateway endpoint validates the `X-Experience-API-Version` header, which needs to follow a given convention.
   Out of convenience and efficiency, the actual content of the xAPI event is validated internally by the Lambda
   function (`ProcessXAPIStatementFunction`) that is called next.

Points 3 and 4 are the same as in scenario A.

### Data sharing between Nucleus instances

This process comprises the scenario where a given instance wants to establish a permanent data sharing agreement with
another one. These are the main steps involved in such a process:

1. First of all, we want to establish a trust relationship between the instances by following a 'door knocking' process.
   The entity requesting the connection is the one that door knocks (we'll call it **source entity**), and that means
   it sends a connection request to a configured API Gateway endpoint (`ExchangeApi`) provided by the receiving instance
   (we'll call it **target entity**).

   - This endpoint is effectively public, so there's no associated authentication mechanism, because we understand any
     instance is free to request access to another one.

2. Once the target entity receives the incoming request, there is some offline process that needs to be performed, which
   is not relevant for this document; and then the request can be either accepted or rejected.

   - The accept/reject actions are also modeled as API Gateway endpoints inside the `ExchangeApi` resource.
   - They are always executed from the administration panel, which means only administrator users who have been
     authenticated via Cognito User Pools will be able to call them.

3. When the connection request is accepted, both instances create cross-account IAM roles that allow access to specific
   resources in their respective AWS accounts.

   - We create IAM roles on both instances (source and target) because they need to communicate on a common basis, not
     just for sharing events, but also to update some status, transmit errors or perform other tasks, like in the S3
     file transfer. By establishing a trust relationship via cross-account IAM roles we have a robust, permanent way for
     instances to share whatever information they need.
   - The IAM roles are created dynamically by the application, so they're not previously defined as CloudFormation
     resources in the `template.yaml` file.
   - In order to avoid the _confused deputy_ problem, we require instances to provide an external ID when assuming the
     cross-account role.
   - When assuming a cross-account role, we always rely on temporary credentials, obtained by using the
     `ChainableTemporaryCredentials` class or the `assumeRole()` method from the AWS JavaScript SDK.

4. From that moment on, both instances have created a mechanism they can use to transmit information. There are a few
   other API Gateway endpoints that are set up as part of the exchange process, but they all share the same
   authorization mechanism, which is IAM roles (identified as `AWS_IAM` in API Gateway). This authorization scheme
   demands using actual AWS credentials (access key id and secret key) to access the endpoint.

   - In all cases, these endpoints are meant to be called internally by trusted Nucleus instances, which implies the IAM
     credentials that are used never reach anything beyond the AWS servers.

### Raw file upload & transfer

This component allows uploading files to S3 using a set of generated temporary credentials, as well as automatically
sharing them with other Nucleus instances that have already established a trust relationship with us.

Let's see what steps are involved security-wise:

1. Any user belonging to the source organization (the instance sharing the files) can easily obtain temporary IAM
   credentials to upload files to an S3 bucket. This can be accomplished by calling an API Gateway endpoint
   (`GenerateUploadCredentialsApi`).

   - The endpoint only accepts a `POST` request.
   - A specific bucket (`UploadS3Bucket`) is created, its sole purpose being to store the files that are to be shared
     with other Nucleus instances.
   - The uploaded files are automatically deleted after 7 days.
   - The returned temporary credentials are only valid for 1 hour, and only give access to a specific folder inside the
     upload S3 bucket.
   - The chosen authentication mechanism is API keys (`GenerateUploadCredentialsApiKey`). We're aware that it's not the
     most secure option available in API Gateway, but we had to strike a balance between easy of use for developers with
     moderate technical skills versus providing a very secure authentication scheme. After some discussion, we agreed
     that API keys provided a good enough balance.

2. After the user has finished uploading a file to the upload S3 bucket, a Lambda function (`ProcessUploadFunction`) is
   triggered. This function is responsible for processing the file and generating an internal Nucleus event that
   describes the file upload.

   - The actual file is never opened or manipulated by the Lambda function. It only deals with the metadata that
     is provided by S3.

3. If the file upload processing is successful, the generated Nucleus event (it's actually a simple JSON structure) is
   inserted into the event processor stream, just as any regular xAPI collection event.
4. Everything after this step is basically the same that is described in the "Data sharing between Nucleus instances"
   section. The event processor Kinesis stream stores the event describing the file upload and shares it with those
   instances that are subscribed to receive it.
5. Once the file upload event arrives to the target entity, an additional Lambda function (`TransferObjectFunction`) is
   triggered, whose purpose is transferring the file from the upload bucket in the source entity to the download bucket
   (`DownloadS3Bucket`) in the target entity.

   - We've already described how the trust relationship between instances via cross-account IAM roles is used to set up
     a permissions framework that they can rely on for whatever communication is needed. In this case, we effectively
     use it to give the target entity permission to grab the file from the upload S3 bucket in the source entity.

6. Additionally, notifications and errors that might happen as part of the transfer process are sent to an SNS Topic
   (`FileTransferNotificationsTopic`). No specific permissions or configuration is employed.

### Administration panel

The administration panel is a Single Page Application built using React & AWS Amplify technologies. All of its sections
are private, which means the user is forced to be authenticated through Cognito User Pools prior to being granted
access. Additionally, access to resources in the account is provided by Cognito Identity Pools.

It's also worth noting that, for the most part, we rely on [Amplify's Auth API](https://aws-amplify.github.io/docs/js/authentication) when it comes to obtaining and managing
credentials.

Also as part of the administration panel, we set up a few API Gateway endpoints (`FileTransferNotificationsApi` and
`EntitiesApi`, among others) that provide some useful back-end services. In all cases where authentication is required,
they leverage the IAM credentials that are managed by Amplify. This effectively means these endpoints use Cognito User
Pools as the only valid method of authentication.

### Nucleus CLI & installer

This is a separate application component that offers a basic CLI utility, mostly useful to perform the initial
installation of both the core CloudFormation template and the Amplify application that builds the administration panel.

The actual behaviour of the installer is quite simple, but from the point of view of the security there are a couple of
points worth mentioning:

- In order to perform the deployment through CloudFormation, the installer expects the AWS CLI to be present in the
  system, and executes system commands from the application code. We use the
  [execa](https://github.com/sindresorhus/execa) library, which by default should prevent against command injection.
  Additionally, commands and arguments are always split when executing the system calls.
- After the first execution of the installer, the configuration values set up by the user are stored in disk, so that in
  next executions we can omit this step. The values are stored as a JSON structure in the `.nucleus-config.json` file.
  It is created with strict permissions (`0400`) that only allow the user to read & write the file.

## Other considerations

- S3 buckets are locked-down by default. They don't allow any public access and have Versioning and SSE enabled, using
  `AES-256` using Amazon S3-Managed Keys (`SSE-S3`).
- Logs generated by S3 operations are stored in a specific bucket (`LoggingS3Bucket`), which is also configured
  following the options described above.
- Kinesis data streams have server-side encryption enabled, and use the default master KMS key for Kinesis
  (`alias/aws/kinesis`).
- DynamoDB tables are encrypted by default using the master key provided globally by Amazon.
- Point-in-time recovery backups are enabled for all DynamoDB tables.
- API endpoints log their error output to CloudWatch Logs. Detailed CloudWatch metrics are enabled as well.
- Lambda functions encrypt the environment variables at rest using the default Lambda service key (`aws/lambda`).
- CloudTrail logs are globally enabled (`CloudTrail`) for all AWS API calls and other services like IAM. It's configured
  to dump the logs inside a dedicated bucket (`CloudTrailLoggingS3Bucket`).
