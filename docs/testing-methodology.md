# Testing methodology

## Introduction
In this section we try to describe what we believe is the best approach when dealing with tests in a
serverless architecture like the one we're using in SSDN.

First of all, let's establish a few points that will make clear our goals:
- Lambda functions should generally be single-threaded and focused only on dealing with a single 
use-case.
- We want to follow the [test pyramid concept](https://martinfowler.com/bliki/TestPyramid.html) that
states that lower-level (unit) tests should be much more abundant than higher-level 
(integration/e2e) tests. In serverless applications, this pyramid can change its shape to be wider 
at the top; however, the same basic principle applies.
- We acknowledge the inherent differences from a typical server-based architecture, so having a 
versioned infrastructure that is easy to deploy and replicate becomes highly important.

## Unit tests
Unit tests represent the minimal action a test can encompass. They're usually written to exercise 
specific business logic inside a class or a function. They're called "unit" because their scope is 
never beyond an individual class.

In the context of SSDN, unit tests should be used to make assertions about the logic inside the
lambda functions. They should not bother with specific code that serves to glue up the functions 
inside the lambda containers, so they should ideally avoid executing the lambda handler. Instead, we 
want our business logic to be 100% independent of the FaaS provider, so we'll write separate 
classes, and unit tests, that act as our service layer and are only concerned with business specific 
problems. The actual lambda handlers can be later tested in an integration test.

## Integration tests
An integration test usually involves one or two components and verifies that they cooperate as 
expected. This is different from a unit test because its focus is more on testing the effective
boundaries of a component and how it communicates with others, and less on testing the internal 
logic.

Since in a serverless architecture we don't really control the servers, and every component is run
independently from one another, this means they rely heavily on their integration in order to work 
properly. That's why integration tests now become much more important, at least compared to a more 
traditional server-based approach. 

## End-to-End tests
Also called acceptance or validation tests, they usually represent the most high-level type of test 
in the system. In this case, we're not interested in validating specific logic inside the components 
or trying to verify that their communication is working. Instead, in an end-to-end test we 
exercise the system from the outside, as a regular user would, and try to observe the outcome, 
making the necessary assertions but only on effects that are tangible; that means we can not make 
assertions on the internal state of components, for example.

This kind of test is very useful to make sure that the system is working as a whole, and in many 
cases is able to detect errors that are missed by either unit or integration tests. At the same 
time, they're usually very slow and costly to execute, so it's better to only rely on them to test 
the more general use cases in the application.

Our recommendation for end-to-end tests is to stick to the public interfaces of the SSDN 
application and avoid making assertions on internal components or temporary state. 

We also discourage the use of log records in order to query the outcome of an operation. Although it
works, it makes our tests more brittle and we create a strong dependency between our end-to-end 
tests and our log messages, which is not ideal because a small change in a simple string now means 
our tests stop working, even though the application is perfectly fine. We think it's almost always 
better to use specific programmatic tools to verify the outcome of the test. For example, use a 
regular HTTP client if you want to verify a response from an API, or the AWS SDK if you want to 
check for some value in a DynamoDB table, or a headless browser instance, like 
[Puppeteer](https://github.com/GoogleChrome/puppeteer), if you need to control some UI interaction 
made by the user.

Another point worth mentioning is to avoid waiting a fixed amount of time for some change to happen
in our end-to-end test. This is a bad practice and can lead to errors in tests, besides making them
slower. Instead subscribe to events that can inform your code when the expected change has actually 
happened or, if no such event exists, implement your own polling mechanism with a timeout that 
marks the test as failed after a certain number of retries.

## Development workflow

When it comes to actual development in a serverless application like SSDN, we'd like to consider
the following stages from the point of view of a programmer, in relation to testing.

### Local
This is where the bulk of the application is going to be developed. Unit tests should be the star in
this stage, because they're fast to run and should be developed alongside the main application code.

You are encouraged to run `yarn test:watch` while developing, so you can see in realtime any failing
tests and have immediate feedback.

Integration tests are also susceptible to run in a local environment. Whether you want to mock your
dependencies (a DynamoDB table for example) or not is up to you. In both cases there are options to 
run your tests properly. For example, you might invoke lambda functions or API Gateway endpoints 
100% locally by executing `sam local invoke <FUNCTION>` and `sam local start-api` respectively, 

A nice tool included in the project is [LocalStack](https://localstack.cloud/). It can start local
instances of most of the available AWS services, allowing you to develop against them locally and 
offline. This greatly simplifies accessing complex services like Kinesis or DynamoDB from your 
tests. In fact we use it in some unit tests to mock some of these services. However, we don't 
recommend using it for integration testing, as in most cases it does not cover all the methods in 
the official APIs provided by Amazon, or the responses are too simple to represent what a real 
integration should look like.

### Development
If you prefer to run your integration tests in a more realistic environment, you can instead deploy 
your changes to the development stack and point your tests to run on it. This way you're using a
live environment to test your code, so no mocks are really needed, but they run from your local 
environment, which is much more convenient than pushing changes to the repository and going through 
the whole CI process.

If you want to deploy your changes to a new stack (`SSDN-Development` for example), you'll need 
to run the following commands:

```bash
sam package --template-file template.yaml \
            --output-template-file packaged.yaml \
            --kms-key-id arn:aws:kms:us-east-1:264441468378:alias/aws/s3 \
            --s3-bucket codepipeline-us-east-1-528618056037
```
_You might want to adapt the above command to include your own KMS Key ID and S3 bucket_

```bash
sam deploy --template-file packaged.yaml \
           --stack-name SSDN-Development \
           --capabilities CAPABILITY_IAM
```

### Testing
This is an ephemeral environment whose only purpose is running the integration and end-to-end tests
in a fresh environment, in the context of the CI server. Once the tests are run successfully, all 
the resources in the testing stack are deleted, meaning the deployment to other environments like 
staging or production is now feasible.

We don't recommend using the testing environment for any activity that involves development. One of 
the benefits of recreating the stack from scratch every time, and not using it for anything other 
than running the tests, is that we can be certain that the SAM infrastructure defined in our 
`template.yaml` is correct and that the environment has not been modified in any way that could 
affect the results of our tests.

### Production
This is a live environment where actual work is being done. Obviously we're not meant to run any 
tests here, although sometimes some forms of smoke testing can be executed to verify that the 
production environment is behaving properly, at least for the most important features.

In our specific case, we might opt for running the end-to-end tests in production, right after a new
important or big change has been applied. However, for the time being we think it's more appropriate
to simply perform some manual tests to verify that the system works.

## More information
- [The best ways to test your serverless applications](https://medium.freecodecamp.org/the-best-ways-to-test-your-serverless-applications-40b88d6ee31e)
- [Testing Strategies in a Microservice Architecture](https://martinfowler.com/articles/microservice-testing/)
- [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
