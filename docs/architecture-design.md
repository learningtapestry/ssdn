# Secure Student Data Network Architecture Design

## Key Points
The MVP version of the Secure Student Data Network (SSDN) guarantees adherence to the following principles:

* **Simple:** We don’t use systems or services unless they are vital for the application’s operation. Anything useful or convenient, but not vital, is considered to be a project extension or enhancement and will be saved for future versions.
* **Secure by default:** When handling sensitive data, users of the SSDN can be confident that the system will always default to a configuration with the least chance of exposing unintended information or provoking side effects. This means we use whitelists to grant access, deny connections over insecure channels, and encrypt data whenever possible.
* **Distributed:** eAlthough the system is designed to work as a monolithic application, its modules must be built independently and be able to operate on their own, which creates resiliency against other components’ failures. For that reason, many parts of our technical solution rely on AWS serverless technologies and cloud services.
* **Fast:** We want the system to perform well under load and be able to process a large number of events simultaneously; this is especially relevant for the Collection APIs. We will minimize the number of data processing steps and use the best technologies and services.
* **Multi-tenant:** We plan to support multi-tenancy at the partner level, but not at the Ed Tech vendor level. A SSDN node can collect data for multiple partners (aka Districts) for a single vendor. However, it cannot collect data for multiple Ed Tech vendors on a single node. Future versions may support more advanced multi-tenancy.


## Components

### Collection endpoint

#### Main characteristics
* It represents the entry-point for data collection from the agents.
* The transport format is based on standards, such as xAPI and Caliper.
* It must be capable of accepting a large number of simultaneous requests.

    
#### Committed solution
* Design a RESTful API served by the AWS API Gateway.
* The API endpoint will be accessed by collection agents configured in browsers and acting anonymously. API Keys are a good mid-term solution to help us identify a user making a request while, at the same time, not allowing full public access.
* The incoming API requests are processed by a Lambda function that inserts the data into a Kinesis Data Stream (`Event Processor Stream`).
* Payload is validated according to the [JSON Schema for Tin Can API Objects](https://github.com/RusticiSoftware/TinCanSchema).
It's important to keep in mind that we're not performing any internal format validation. The current 
schema will accept any document as long as it contains a well-structured xAPI resource.
* The xAPI endpoint aims to be compatible with the [official xAPI Communication Spec](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#partthree),although it only implements a small subset of its features. More specifically, we implement the `POST` and `PUT`methods that allow submitting and creating new xAPI statements.
* xAPI statements can can be sent either individually or as a batch of records in an array.


### Event processor

#### Main characteristics
* In the most basic of its forms, the collection process involves an external-facing API that receives collection events from one or more agents, and an internal event processing mechanism that transfers them to the routing component.
* It must be fast enough to process a large number of simultaneous requests or unexpected peak loads so it does not miss any collection events.
* Its design should be simple and easily scalable.

#### Committed solution
* Incoming events received from the collection endpoint are written to the `Event Processor Stream`.
* Data can have many potential consumers which represent the SSDN nodes authorized to receive it.
* The data event, regardless of its possible sharing outcomes, is finally pushed to the data store 
component to be persisted in a permanent way.
* A single Kinesis shard accepts up to 1000 requests/sec. which satisfies the vast majority of customers.


### Data Store

#### Main characteristics
* It represents the persistence layer in the overall application.
* It stores the events collected by the agents and the data received from other nodes.
* It can potentially store other relevant data useful to the application.

#### Committed solution
* At an architectural level, the data store consists of a Kinesis data stream  (`Event Storage 
Stream`) that receives incoming records from collection agents, producers as well as other sources, 
and a Kinesis Firehose stream (`Event Delivery Stream`) that permanently persists the data.
* The `Event Storage Stream` is connected directly, and exclusively, to the `Event Delivery Stream`.
Its main purpose is acting as a proxy for the Firehose stream while avoiding its external exposure.
* By default, the `Event Delivery Stream` stores automatically to S3 with additional capabilities to store in RedShift, ElasticSearch and 
Splunk. The final user can decide what storage destinations they want to enable.
* Data can be encrypted, processed, and compressed before being sent to the final data stores.
* RedShift enables any SSDN node to create its own data warehouse if desired.
* Additional data stores or destinations like DynamoDB, RDS, a third party LRS, and analytics tools are addressed by plugins that are able to extract the data from our SSDN data store.


### Data exchange & Routing

#### Main characteristics
* Called when one SSDN node wants to share data with another SSDN node.
* Identifies which destinations are valid, and filters out data according to the consumer’s preferences.
* Must incorporate some kind of retry mechanism and fail gracefully when the destination node is not available..
* Must log data exchange on the source and the destination SSDN node.
* As in the case of the event processor, the received data is pushed to the data store.

#### Committed solution
* We follow a `push` strategy where the producer inserts the data into the consumer's storage stream, which is part of its data store component. This makes capabilities like filtering easier and more economical to perform at the routing step.
* The insertion step is performed by a Lambda function residing in the producer. In its execution, the function applies the required filters and performs any other required processing. The function then pushes the record to every consumer's storage stream.
* Authorization is managed via cross-account IAM roles. When a consumer is granted access, it establishes a trust relationship between the SSDN nodes. IAM roles are created and, from that moment on, the producer is able to push records into the consumer's storage stream.
* Data sharing between nodes is an internal step accomplished by AWS services. For the time being, we don't plan on adding further abstraction layers in the form of REST/GraphQL APIs.


### Data export interface & DynamoDB plugin

#### Main characteristics
* Exports the data inside a SSDN node to an external target.
* Must not be tied to a specific storage engine or platform.
* The reference implementation of the design will be based on the DynamoDB plugin.

#### Committed solution
* Its purpose is to read the data from one of the data store destinations, like S3, and export it to another system, like DynamoDB.
* We will design a generic interface that all plugins must adhere to in order to perform reading & extraction.
* The plugin can be invoked on-demand and is modeled as a Lambda function.


### Authentication & Authorization

#### Main characteristics
* Authorization targets one scenario: accepting data from an external source.
* It is completely stateless.
* It makes revoke access easy, in case current keys are compromised.
* Each organization determines their key rotating policies.

#### Committed solution
* In general, all permissions and access control are handed over to AWS IAM. That means other SSDN nodes, or any external user, wanting access to our data must use AWS credentials and services.
* Two nodes that have previously agreed on sharing data set up respective IAM cross-account roles that represent the permissions granted to each other.
* A cross-account IAM role is always assumed by the organization in a temporary fashion through AWS Security Token Service (STS), making use of the `assumeRole` API method call.
* Cross-account IAM roles also share an external ID which avoids the ["confused deputy"](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html#external-id-purpose) 
problem. The verification code that is exchanged as part of the door knocking process can be used 
for this purpose.
* In some circumstances, the producer and consumer may need to communicate in order to inform of problems, share some configuration details, do status updates, etc. In those cases, we'll set up API endpoints that will be controlled via IAM policies. This means the cross-account IAM role that we set up after a successful door knocking process must include the necessary IAM policies to allow access to selected API Gateway endpoints and methods by the trusted organization.
* The administration panel leverages Cognito User Pools to authenticate the users trying to access the application. Temporary access to resources in the AWS account are obtained through Cognito Federated Identities.


### Intercommunication (door-knocking mechanism)

#### Main characteristics
* This step involves offline communication between the providers and the districts, but that does not mean the application cannot help guide and monitor it.
* Must aid the user in the offline authorization process by providing the necessary data.
* Should monitor the whole process and remind the user of its state at any time. 

#### Committed solution
* We'll generate a simple form that requesting organizations can fill in and, after that, receive a 
verification code that can be used by the receiving organization to validate the request.
* The process should be as easy and streamlined as possible.
* The validating organization will be able to review and then accept/reject the request from 
their administration panel.
* Connection requests are scoped to a specific namespace and a set of formats. A namespace is a free-form organizational or content-type data domain, written as an URL hostname, for example, `mydata.myorganization.com`. A format identifies the standard used to represent or structure data, for example, `Caliper`, `Ed-Fi`, `xAPI`.

### S3 file transfer

#### Main characteristics
* This feature allows SSDN nodes to exchange binary data in the form of S3 files.
* Nodes with established relationships are able to exchange files associated to the namespaces and formats which were authorized during door-knocking.
* It is trivial for a user to store files in the node's S3 bucket, preferably using standard S3 tools and libraries.
* Once a file is stored, it is eventually mirrored by consumer nodes.
* Plugins have insight into metadata information for the exchanged files.
* Users have visibility into the files that are being exchanged.

#### Committed solution
* When a file needs to be stored, users invoke an API method that provisions a folder in an S3 bucket. The API method takes in the namespace and format as parameters. It returns temporary credentials for writing to that folder. The credentials can be used by any tool that uses the S3 API.
* Uploaded files are stored in a dedicated upload bucket organized by namespace and format.
* Whenever a file is written to the upload bucket, an event is created and sent to the node's processing stream (Kinesis), which contains metadata about the file. This event is then routed to consumer nodes.
* During the door-knocking process for a consumer node, the consumer is granted read access to a specific folder in the upload S3 bucket of the provider node (corresponding to the door-knocking request). The consumer receives an event for an upload in that folder, then it downloads the file. This happens automatically.
* Downloaded files are stored in a dedicated download bucket organized by provider node, namespace, and format.
* SNS notifications are generated for S3 events.

### Administration panel	

#### Main characteristics
* User-facing back office where users can perform various administrative tasks. 
* Allows reviewing and managing requests made by other nodes.
* Allows managing the administrator users that can access the panel.
* Allows browsing through the generated logs to detect problems or misconfigurations.
* Allows tweaking the configuration of the running SSDN node.

#### Committed solution
* Application architecture is based on the Single Page Application (SPA) approach. 
* The front-end is stored in a S3 bucket, and the back-end takes advantage of API Gateway + Lambda + DynamoDB.
* AWS Amplify framework allows us to easily manage and deploy the web application following the serverless model.
* The persistence requirements are simple, and they are handled by DynamoDB tables.


### Logging

#### Main characteristics
* Transversal component impacting all other components.
* It’s important to create quality logs, so that debugging and tracing errors or inconsistencies in 
the application is easier.
* Our intention is to build a powerful and easy to use logging module that can be called from any component in the application, irrespective of the technology or language used.

#### Committed solution
* All relevant logs must be written to CloudWatch.
* Further processing of logs is easy to accomplish by triggering additional Lambda functions.


### Collection agent

#### Main characteristics 
* Collection agents are software libraries designed to wrap data collection activities to simplify data collection from a particular software language.
* The collection agent sends data as xAPI messages. It may have some custom API components to enable secure connection to the receiving the SSDN node’s Collection Endpoint (authentication, client identification).


#### Committed solution
* The initial agent will be written in Javascript, and designed to work from within the range of common web browsers (Chrome, IE, Edge, Firefox, and Safari). The Javascript agent will use “third party library” architecture techniques to ensure it is safely and performantly loadable into arbitrary web pages.
* The agent will support key user event activities, where those activities are supported by individual browsers, such as:
  * Heartbeat, for browser visits. The browser periodically sends an event, using the xAPI verb heartbeat, to indicate that it is active. A session's duration can be tracked by aggregating events with the same heartbeatId.
  * Video interactions that happen in the browser. We're collecting messages with the played and paused verbs.
* The agent will need to be configured by the Node operator for authentication details back to the Node, as well as client and user ID configuration, so that the data collected can be associated to the correct client and user on collection.
* Due to the public nature of Javascript libraries on browsers, authentication capabilities will be public, and therefore the ability to submit data to the Node will be a public capability.


## High level diagram


![SSDN - High Level Architecture](https://github.com/awslabs/ssdn/blob/master/docs/SSDN%20%2B%20SQS.png)


## Tools & Frameworks

Below you'll find the frameworks and tools we use to implement the SSDN application: 

* **Main development language:** [TypeScript](https://www.typescriptlang.org/)
* **Testing frameworks:** 
    * [Jest](https://jestjs.io/)
    * [Cypress](https://www.cypress.io/)
* **Code building & packaging:** 
    * [Babel](https://babeljs.io/)
    * [Parcel](https://parceljs.org/)
* **Logging library:** [Pino](http://getpino.io/)
* **Code repository:** [GitHub](https://www.github.com/)
* **Main development framework :** [AWS Serverless Application Model (SAM)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
* **Administration panel frameworks:** 
    * [AWS Amplify](https://aws-amplify.github.io/)
    * [React](https://reactjs.org/)
* **Deployment automation & Continuous delivery:** 
    * [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
    * [AWS CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
    * [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)

