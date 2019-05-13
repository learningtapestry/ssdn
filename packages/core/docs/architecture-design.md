# Architecture design

## Key Points
Overall, our main focus for the MVP version of the application is guaranteeing that it adheres to these basic principles:

* **Simple:** we shouldn’t use any system or service unless it’s vital for the application 
operation. Anything that we might consider useful or convenient but not vital can be treated as a 
project extension or an enhancement for future versions.
* **Secure by default:** when dealing with sensitive data, we want the users of the Nucleus platform 
to be confident that the system will always default to a configuration that has the less chance of 
exposing unintended information or provoking side effects. This means, for example, using whitelists 
to grant access, denying connections over insecure channels, encrypting data whenever possible, etc.
* **Distributed:** even though we’re designing the whole system to work as a monolithic application,
its modules must be built independently and be able to operate on their own, being resilient to 
other components’ failures. For that reason, many parts in our technical solution rely on serverless 
technologies & cloud services offered by Amazon Web Services.
* **Fast:** we want the whole system to perform well under load and be able to process a huge number 
of events simultaneously. This is especially relevant for the Collection APIs. To achieve this, we 
must take into account minimizing the number of data processing steps as well as using the most 
adequate technologies and services.
* **Multi-tenant:** Our plan is to support multi-tenancy at the “partner” level, but not at the 
“Ed Tech vendor” level. So a Nucleus node can collect data for multiple partners (aka Districts) 
for a single vendor. But it cannot collect data for multiple Ed Tech vendors on a single node. 
Future versions may support more advanced multi-tenancy.


## Components

### Collection endpoint

#### Main features
* Represents the entry-point for data collection from the agents.
* The transport format will be based on standards, such as xAPI and Caliper.
* It must be capable of accepting a very large number of simultaneous requests.
    
#### Committed solution
* Design a RESTful API that's served by AWS API Gateway.
* Since most of the time the API endpoint will be accessed by collection agents configured in 
browsers and acting anonymously, we consider API Keys a good mid-term solution to help us identify 
the user making the request while, at the same time, not allowing full public access.
* The incoming API requests are processed by a Lambda function that inserts the data into a Kinesis 
Data Stream (`Event Processor Stream`).
* Payload is validated according to the [JSON Schema for Tin Can API Objects](https://github.com/RusticiSoftware/TinCanSchema).
It's important to keep in mind that we're not performing any internal format validation. The current 
schema will accept any document as long as it contains a well-structured xAPI resource.
* The xAPI endpoint aims to be compatible with the [official xAPI Communication Spec](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#partthree),
although it only implements a small subset of its features. More specifically, we implement the 
`POST` and `PUT`methods that allow submitting and creating new xAPI statements.
* xAPI statements can can be sent either individually or as a batch of records in an array.


### Event processor

#### Main characteristics
* In the most basic of its forms, the collection process involves an external-facing API that 
receives collection events from one or more agents, and an internal event processing mechanism that 
handles them to the routing component.
* It must be fast enough to process a large number of simultaneous requests or unexpected peak loads 
so it does not miss any collected event.
* Its design should be simple and able to scale easily.

#### Committed solution
* Incoming events received from the collection endpoint are written to the `Event Processor Stream`.
* Data can have many potential consumers, which represent other Nucleus nodes that are authorized 
to receive it.
* The data event, regardless of its possible sharing outcomes, is finally pushed to the data store 
component to be persisted in a permanent way.
* A single Kinesis shard accepts up to 1000 requests/sec. which seems more than enough for the vast
majority of customers.


### Data Store

#### Main characteristics
* Represents the persistence layer in the overall application
* Stores the events collected by the agents as well as data received from other instances.
* Can also potentially store other relevant data useful to the application. 

#### Committed solution
* At an architectural level, the data store consists of a Kinesis data stream (`Event Storage 
Stream`) that receives incoming records from collection agents, producers as well as other sources, 
and a Kinesis Firehose stream (`Event Delivery Stream`) that permanently persists the data.
* The `Event Storage Stream` is connected directly, and exclusively, to the `Event Delivery Stream`.
Its main purpose is acting as a proxy for the Firehose stream while avoiding its external exposure.
* By default the `Event Delivery Stream` stores automatically to S3, RedShift, ElasticSearch and 
Splunk. The final user can decide what storage destinations he/she wants to enable (either one or 
all of them).
* Data can be encrypted, processed, compressed, etc. prior to being sent to the final data stores.
* RedShift enables any Nucleus instance to create its own data lake if desired.
* Additional data stores or destinations like DynamoDB, RDS, a third party LRS, analytics tools, 
etc. will be addressed by plugins that are able to extract the data from our Nucleus data store.


### Data exchange & Routing

#### Main characteristics
* Called when a Nucleus instance wants to share data with another one.
* Identifies what destinations are valid and filters out data according to the consumer preferences.
* Must incorporate some kind of retry mechanism and fail gracefully in case the destination instance 
is not available.
* Must log data exchange on source and destination Nuclei.
* As in the case of the event processor, the received data is finally pushed to the data store.

#### Committed solution
* We follow a `push` strategy, where the producer inserts the data into the consumer's storage
stream, which is part of its data store component. This way, capabilities like filtering will be 
easier to perform at the routing step, as well as more economical.
* The insertion step we just mentioned is performed by a Lambda function residing in the producer. 
In its execution, it will apply the required filters and perform any other required processing, and 
eventually will push the record to every consumer's storage stream.
* Authorization will be managed via cross-account IAM roles. When a consumer is granted access, it
means a trust relationship between the Nucleus instances is established. IAM roles will be created 
and, from that moment on, the producer will be able to push records into the consumer's storage 
stream.
* Since we consider data sharing between instances an internal step, it will be accomplished by 
directly using AWS services. For the time being, we don't plan on adding further abstraction layers 
in the form of REST/GraphQL APIs.


### Data export interface & DynamoDB plugin

#### Main characteristics
* Exports the data inside a Nucleus instance to an external target.
* Must not be tied to a specific storage engine or platform.
* The reference implementation of the design will be based on the DynamoDB plugin.

#### Committed solution
* Its purpose is reading the data from one of the data store destinations (S3 for example) and 
exporting it to another system, like DynamoDB.
* We'll design a generic interface that all plugins must abide to in order to perform the reading & 
extraction.
* The plugin can be invoked on-demand, so it makes sense to model it as a Lambda function.


### Authentication & Authorization

#### Main characteristics
* Authorization basically targets one scenario: accepting data from an external source.
* It should be completely stateless.
* It should make possible to revoke access easily, in case current keys are compromised.
* Key rotating policies are up to every organization.

#### Committed solution
* In general, all permissions and access control will be handed over to AWS IAM. That means other 
Nuclei, or any external user for that matter, wanting to access our data will need to use AWS 
credentials and services.
* Two instances that have previously agreed on sharing data set up respective IAM cross-account 
roles that represent the permissions granted to each other.
* A cross-account IAM role is always assumed by the organization in a temporary fashion through AWS
Security Token Service (STS), making use of the `assumeRole` API method call.
* Cross-account IAM roles also share an external ID which avoids the ["confused deputy"](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html#external-id-purpose) 
problem. The verification code that is exchanged as part of the door knocking process can be used 
for this purpose.
* In some circumstances, producer and consumer may need to communicate in order to inform of some 
problem, share some configuration detail, do a status update, etc. In those cases, we'll 
set up API endpoints that will be controlled via IAM policies. This means the cross-account IAM 
role that we set up after a successful door knocking process will need to include the necessary 
IAM policies to allow access to selected API Gateway endpoints and methods by the trusted 
organization.
* Regarding the administration panel, it leverages Cognito User Pools in order to authenticate the
users trying to access the application. Temporary access to resources in the AWS account are 
obtained through Cognito Federated Identities.


### Intercommunication (door-knocking mechanism)

#### Main characteristics
* This step involves mostly offline communication between the providers and the districts, but that 
does not mean the application can not help guiding and monitoring it.
* Must aid the user in the offline authorization process by providing the necessary data.
* Should monitor the whole process and remind the user of its state at any time. 

#### Committed solution
* We'll generate a simple form that requesting organizations can fill in and, after that, receive a 
verification code that can be used by the receiving organization to validate the request.
* The process should be as easy and streamlined as possible.
* The validating organization will be able to review and then accept/reject the request right from 
their administration panel.


### Administration panel	

#### Main characteristics
* User-facing back-office where users can perform various administrative tasks. 
* Allows reviewing and managing the requests made by other instances.
* Allows managing the administrator users that can access the panel.
* Allows browsing through all the generated logs to detect problems or mis-configurations.
* Allows tweaking the configuration of the running Nucleus instance.

#### Committed solution
* Application architecture is based on the Single Page Application (SPA) approach. 
* The front-end is stored in a S3 bucket, whereas the back-end takes advantage of API Gateway + 
Lambda + DynamoDB.
* AWS Amplify framework allows us to easily manage and deploy the web application following the 
serverless model.
* Since the persistence requirements are simple enough, they are handled by DynamoDB tables.


### Logging

#### Main characteristics
* Transversal component, affecting all the other ones.
* It’s important to create quality logs, so that debugging and tracing errors or inconsistencies in 
the application becomes much easier.
* Our intention is building a powerful yet simple to use logging module that can be called from any 
component in the application, irrespective of the technology or language used.

#### Committed solution
* All relevant logs must be written to CloudWatch.
* Further processing of logs should be easy to accomplish by triggering additional Lambda functions.


### Collection agent

See this [GitHub issue](https://github.com/learningtapestry/nucleus/issues/1) for details.


## High level diagram


![Nucleus - High Level Architecture](https://user-images.githubusercontent.com/1306310/57625133-8dbb1080-7593-11e9-9b81-7325dee03923.png)


## Tools & Frameworks

Below you'll find the frameworks and tools we use in order to implement the Nucleus application. 

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

