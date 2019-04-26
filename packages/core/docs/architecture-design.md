# Architecture design

## Key Points
Overall, our main focus in the first version of the application is guaranteeing these basic
principles:

* **Simple:** we shouldn’t use any system or service unless it’s vital for the application 
operation. Anything that we might consider useful or convenient but not vital can be treated as a 
project extension or an enhancement for future versions.
* **Secure by default:** when dealing with sensitive data, we want the users of the Nucleus platform 
to be confident that the system will always default to a configuration that has the less chance of 
exposing unintended information or provoking side effects. This means, for example, using whitelists
to grant access or denying connections over insecure channels, among many other things.
* **Distributed:** even though we’re designing the whole system to work as a monolithic application,
its modules must be built independently and be able to operate on their own, being resilient to 
other components’ failures. For that reason, many of our technical proposals involve the utilization 
of serverless technologies & cloud services offered by Amazon Web Services.
* **Fast:** we want the whole system to perform well under load and be able to process a huge number 
of events simultaneously. This is especially relevant for the Collection & Emitter APIs and, to 
achieve this, we must take into account minimizing the number of data processing steps as well as 
using the most adequate technologies and services.
* **Multi-tenant:** Our plan is to support multi-tenancy at the “partner” level, but not at the 
“Ed Tech vendor” level. So a Nucleus node can collect data for multiple partners (aka Districts) 
for a single vendor. But it cannot collect data for multiple Ed Tech vendors on a single node. 
Future versions may support more advanced multi-tenancy.


## Components

### Collection endpoint

#### Main features
* Represents the entry-point for data collection from the agents.
* The transport format should be based on standards, like xAPI or Caliper.
* It must be capable of accepting a very large number of simultaneous requests.
    
#### Proposed solution
* Design a RESTful API that's served by AWS API Gateway.
* The incoming API requests are processed by a Lambda function that inserts the data into a Kinesis 
Data Stream.
* Small, individual requests can be handled directly by calling the API, whereas larger requests 
(> 1MB) could be stored in files with xAPI metadata and then uploaded to S3 and bulk-processed by 
the API.
* Performance of Lambda functions seem quite good on any of the supported languages. However, we'll 
probably need to address their cold start times in some cases, because that could negatively affect 
the collection performance significantly.


### Event processor

#### Main characteristics
* In the most basic of its forms, the collection endpoint involves an external-facing API that 
receives collection events from one or more agents, and an internal event processing mechanism that 
handles them to the routing component.
* It must be fast enough to process a large number of simultaneous requests or unexpected peak loads 
so it does not miss any collected event.
* Its design should be simple and able to scale easily.

#### Proposed solution
* Incoming events received from the collection endpoint are written to a Kinesis Data Stream.
* The data stream can have many consumers, which represent other Nucleus installations that are 
authorized to receive our data.
* When a Nucleus instance asks us to share data with them and is accepted, a new consumer for our 
stream will be set up.
* The event is finally pushed to the data store to be persisted in a permanent way.
* A single Kinesis shard accepts up to 1000 requests/sec. which seems more than enough for the vast
majority of customers.
* In some exceptional cases, where the scalability requirements are big enough, we might consider 
adding a SQS queue in front of the Kinesis data stream to increase the event processing throughput.


### Routing

#### Main characteristics
* Identifies what destinations are valid when data comes into a Nucleus instance.
* Acts more as a whitelist of entries that are entitled to receive data.
* It might offer additional features to verify that the entries are valid, such as checking that SSL 
certificates are not expired, servers are responding, etc.

#### Proposed solution
* Authorization will be managed via IAM roles. When a consumer is added to our data stream, that 
means a read-only IAM permission will be granted.


### Data Store

#### Main characteristics
* Represents the persistence layer in the overall application
* Stores the events collected by the agents as well as data received from other instances.
* Can also potentially store other relevant data useful to the application. 

#### Proposed solution
* We suggest setting up a Kinesis Firehose stream that receives all incoming data storage requests.
* By default a Firehose stream stores automatically to S3, RedShift, ElasticSearch and Splunk. The 
final user can decide what storage destinations he/she wants to enable (either one or all of them).
* Data can be encrypted, processed, compressed, etc. prior to being sent to the final data stores.
* RedShift enables any Nucleus instance to create its own data lake if desired.
* Additional data stores or destinations, like DynamoDB, RDS, a third party LRS, analytics tools, 
etc. will be addressed by plugins that are able to extract the data from our Nucleus data store (see 
next component for more details).


### Data export interface & DynamoDB plugin

#### Main characteristics
* Exports the data inside a Nucleus instance to an external target.
* Must not be tied to a specific storage engine or platform.
* The reference implementation of the design will be based on the DynamoDB plugin.

#### Proposed solution
* Its purpose is reading the data from one of the data store destinations (S3 for example) and 
exporting the data to another system, like DynamoDB.
* We'll design a generic interface that all plugins must abide to in order to perform the reading & 
extraction.
* The plugin can be invoked on-demand, so it makes sense to model it as a Lambda function.


### Data exchange / Emitter endpoint

#### Main characteristics
* Called when a Nucleus instance wants to share data with another one.
* Must incorporate some kind of retry mechanism and fail gracefully in case the destination instance 
is not available.
* Must log data exchange on source and destination Nuclei.
* As in the case of the event processor, the received data is finally pushed to the datastore.

#### Proposed solution
* Will be implemented as a Kinesis consumer application, preferably using the [Kinesis Client 
Library](https://docs.aws.amazon.com/streams/latest/dev/developing-consumers-with-kcl.html) (KCL).
* An additional REST API endpoint using API Gateway could be developed to handle incoming data 
exchanges from other systems.


### Authentication & Authorization

#### Main characteristics
* Authorization only targets one scenario: accepting data from an external source.
* Should be completely stateless.
* Possibility of revoking access easily, in case keys are compromised.
* Key rotating policies are up to every organization.

#### Proposed solution
* In general, all permissions and control access will be handled over to AWS IAM. That means other 
Nuclei, or any external user for that matter, wanting to access our data will need to use their own 
AWS credentials.
* API endpoints that employ special or very complex authentication schemes could be implemented by 
using a [Lambda authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html).


### Intercommunication (door-knocking mechanism)

#### Main characteristics
* This step involves mostly offline communication between the providers and the districts, but that 
does not mean the application can not help guiding and monitoring it.
* Must aid the user in the offline authorization process by providing the necessary data.
* Should monitor the whole process and remind the user of its state at any time. 

#### Proposed solution
* We'll generate a simple form that requesting organizations can fill in and, after that, receive a 
one-time code that can be used by the receiving organization to validate the request.
* The process should be as easy and streamlined as possible.
* The validating organization will be able to review and then accept/deny the request right from the 
administration panel. For now we are not considering more complex scenarios.


### Administration panel	

#### Main characteristics
* User-facing back-office where users can perform various administrative tasks. 
* Allows tweaking the configuration of the running Nucleus instance.
* Allows reviewing and managing the requests made by other instances.
* Allows browsing through all the generated logs to detect problems or mis-configurations.

#### Proposed solution
* We suggest the development of a regular client/server web application, using an open source 
framework.
* Depending on the specific tasks that the administration panel needs to offer, we might need to use 
an internal database to persist a few things.
* If we finally decide to use a database, we'll choose DynamoDB, since the database requirements 
seem simple enough, and so a NoSQL database seems a better fit.
* We'll develop it as a Single Page Application. The front-end will be stored in a S3 bucket, 
whereas the back-end will take advantage of API Gateway + Lambdas + DynamoDB.


### Logging

#### Main characteristics
* Transversal component, affecting all the other ones.
* It’s important to create quality logs, so that debugging and tracing errors or inconsistencies in 
the application becomes much easier.
* Our intention is building a powerful yet simple to use logging module that can be called from any 
component in the application, irrespective of the technology or language used.

#### Proposed solution
* All logs should be written to CloudWatch.
* Further processing of logs should be easy to accomplish by triggering additional Lambda functions.


### Collection agent

See this [GitHub issue](https://github.com/learningtapestry/nucleus/issues/1) for details.


## High level diagram

![nucleus-architecture](https://user-images.githubusercontent.com/1306310/51056350-de6d2d80-15e2-11e9-8cbc-3ef3146e1475.png)


## Tools & Frameworks

Below you'll find the tools we intend to use in order to implement the Nucleus application. They're 
not definitive but should give you an indication of the kind of setup we'd like to use.

* **Main development language:** [TypeScript](https://www.typescriptlang.org/)
* **Secondary development language:** [Ruby](https://www.ruby-lang.org/)
* **Testing framework(s):** 
    * [Jest](https://jestjs.io/) (Javascript)
    * [RSpec](http://rspec.info/) (Ruby)
* **Code building & packaging:** 
    * [Babel](https://babeljs.io/)
    * [Parcel](https://parceljs.org/)
* **Code repository:** [GitHub](https://www.github.com/)
* **Main development framework :** [AWS Serverless Application Model (SAM)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
* **Deployment automation & Continuous delivery:** 
    * [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
    * [AWS CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
    * [AWS CodeDeploy](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html)
    * [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)

