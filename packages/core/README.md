# Nucleus
Open source application that provides a non-proprietary, vendor-neutral solution for facilitating 
data interchange between public school districts and education technology providers.

## Main dependencies and tools
This project uses the [AWS Serverless Application Model framework](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) 
(AWS SAM) alongside its command-line interface, so it should be compatible with any command that 
SAM supports. In addition to that, the following tools are used:

- [Yarn](https://yarnpkg.com/en/): manages dependencies and project scripts.
- [TypeScript](https://www.typescriptlang.org/): is used as the default implementation language.
- [Parcel](https://parceljs.org/): provides a zero-config application bundler.
- [Babel](https://babeljs.io/): compiles TypeScript code into standard JavaScript and optimizes the 
production builds.
- [Jest](https://jestjs.io/): runs the tests.

## Requirements
First of all, you need to install both the [AWS CLI](https://github.com/aws/aws-cli) and the 
[AWS SAM CLI](https://github.com/awslabs/aws-sam-cli). You'll also need to create an AWS account and 
configure it for these tools. Please check out their documentation if you have any questions or 
want to know additional details.

In order to invoke lambda functions in your local environment, the AWS SAM CLI uses 
[Docker](https://www.docker.com/community-edition), so make sure you've got a recent version 
installed on your system.

After that, you'll need [Node.js](https://nodejs.org/en/download/) version 10.15 or higher, as well 
as [Yarn](https://yarnpkg.com/en/).

## Project layout
For the most part, the folder layout closely resembles the one provided by the SAM CLI 
initialization command. However, some modifications have been introduced in order to simplify our
development workflow.

```bash
root
├── src/                                <-- Main source folder
│   ├── functions/                      <-- Folder containing lambda functions
│   │   └── hello-nucleus/              <-- Source code for a single lambda function
│   │      ├── index.js                 <-- Lambda function code
│   │      └── index.test.js            <-- Unit test for the lambda function
│   ├── repositories/                   <-- Folder containing repository objects
│   │      └── kinesis-repository.ts    <-- Source code for the Kinesis repository
│   ├── schemas/                        <-- Folder containing JSON schemas
│   │      └── xapi-schema.json         <-- JSON Schema file for the xAPI format
│   ├── validators/                     <-- Folder containing validator objects
│   │      └── xapi-validator.ts        <-- Source code for the xAPI validator
├── integration-test/                   <-- Integration and e2e tests folder
│   └── hello.integration.test.js       <-- Integration test for the lambda function
│   └── hello.e2e.integration.test.js   <-- End-to-end test for the lambda function
├── app-helper.ts                       <-- Main application helper
├── logger.ts                           <-- Default global logger object
├── setup.ts                            <-- Bootstrap script for development & testing environments
├── dist/                               <-- Output folder that contains the generated build
├── docs/                               <-- Additional project documentation
├── test-support/                       <-- Support files and code useful for testing
├── .babelrc                            <-- Configuration file for Babel
├── .env                                <-- Declares environment variables for the project
├── .env.test                           <-- Declares environment variables for testing
├── .prettierrc                         <-- Configuration file for Prettier
├── jest.config.js                      <-- Configuration file for the test runner
├── package.json                        <-- Node.js dependencies
├── README.md                           <-- This file
├── template.yaml                       <-- SAM template
├── tsconfig.json                       <-- Configuration file for the TypeScript compiler
├── tslint.json                         <-- Configuration file for the TypeScript linter (tslint)
└── yarn.lock                           <-- Auto-generated dependencies file
```

## Setup
Run the following command to install the project dependencies:

```bash
yarn install
```

Next, start `LocalStack` to bring up a local version of the AWS services:

```bash
localstack start
```

Finally, you'll want to run the setup script in order to create the necessary resources:

```bash
ts-node src/setup.ts
```

## Usage
After the above commands complete successfully, you can start development by running:

```bash
yarn start
```

This will take care of building your TypeScript code automatically whenever a change is detected.

Now, you can use the regular SAM CLI commands to invoke your lambda functions and start a server
for your API. For example, to execute the `Hello Nucleus` lambda function that's included in the 
project run:

```bash
echo '{}' | sam local invoke HelloWorldFunction
```

Or if you want to invoke the lambda function(s) through a local API Gateway, use:

```bash
sam local start-api
```

This will allow you to go to `http://localhost:3000/hello` and call the lambda code from an HTTP
endpoint.

If you want the above commands to access the environment variables defined in your `.env` file, 
remember to export them to your current shell by running `set -a && source .env`.

If you want to know about other commands, please refer to the official AWS SAM CLI documentation.

## Testing
As we already mentioned, we use Jest as the default test runner. You can use the following Yarn 
scripts to run specific types of tests.

### Unit tests
```bash
yarn test
```

This will run all the unit tests; that is, all the tests that reside in the `src` folder. You can
also run the following command to watch for changes in the tests and run them immediately:

```bash
yarn test:watch
```

### Integration & End-to-End tests
These types of tests reside in their own separate folder because they usually relate to more than 
one function or component at the same time. Nevertheless, you can easily run them with the following
command:

```bash
yarn test:integration
```

Due to the nature of these tests, in most cases you'll probably want to run them in the Continuous 
Integration environment. However, sometimes it might be useful to run specific tests in a 
local or development environment. Please refer to the 
[testing methodology guidelines](../../docs/testing-methodology.md) for more information.

## Logging
We use [Pino](https://github.com/pinojs/pino) as the default logging library. We export a customized
instance of this logger in the `logger.ts` file, so you can import it right into your code and start 
using it. 

It's configured to send every log message to the console, so no actual log files exist in the 
project. Keep in mind that everything that is outputted to the console inside a Lambda function will 
be sent to CloudWatch Logs, which is precisely what we want.

By default, the log level is set to `info`, but can be easily tweaked via the environment variable 
`NUCLEUS_LOG_LEVEL`, which accepts all the levels that Pino does. In tests, the log level is set to 
`fatal` in order to avoid getting any messages that probably just add noise to the tests output.

## Deployment
Whenever you're ready to to deploy your changes to a live environment, you should run:

```bash
yarn build
```

This will compile the code, check the TypeScript types and run the linter, as well as generate an 
optimized build suitable for a production environment.

Once the build has completed, you're free to use the regular SAM CLI commands `sam package` and 
`sam deploy` to upload the new code as well as infrastructure changes and deploy them to a known AWS
CloudFormation stack. However, in many cases you'll simply want to push your code to the repository 
and let the CI service perform these steps on your behalf.

## Continuous Integration
There's a Continuous Integration process available that leverages [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
and provides an streamlined way of building, testing and deploying changes in the code and the 
underlying micro-service infrastructure.

In a nutshell, the available pipeline performs the following steps: 

1. Whenever a push is made to the GitHub repository, a web hook is invoked and the build process in 
the CI server is started.
2. Code is built with `yarn build`.
3. Unit tests are run using `yarn test`.
4. The new CloudFormation specification is generated from our `template.yaml` file, containing the 
changes in our infrastructure.
5. A new testing stack is created following the CloudFormation file generated previously.
6. Resources in the testing stack are read from the `Outputs` generated by CloudFormation 
(endpoint or databases URLs, lambda ARNs, etc.) so that the integration tests know where they need 
to point. 
7. Integration tests are run against this new testing environment.
8. The testing stack is no longer needed and is deleted.
9. Changes are deployed to the production stack.

Obviously these steps are sequential, so if one of them fails the deployment is rolled-back and no
changes will be applied to the production environment.

## Coding conventions

In general, we try to stick to the common conventions followed by the Javascript community. 

Coding style and formatting rules are checked by [TSLint](https://palantir.github.io/tslint/) and 
[Prettier](https://prettier.io/). We perform some minor configuration tweaks in these tools, but 
overall we try to stick with their provided defaults.

When it comes to code architecture, we suggest following some well-established patterns like the 
[Hexagonal architecture](https://dzone.com/articles/hexagonal-architecture-it-works) by Alistair 
Cockburn, or [Clean architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) 
by Robert C. Martin. They're different approaches but sharing very similar goals and practices.
Without entering into too much detail, we could point out the following recommendations:
- Try not to couple your classes needlessly. This eventually leads to code that is harder to 
maintain and test. 
- Follow the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) 
in your classes and keep the concerns clearly separated.
- Business logic should be completely independent of other components using it. That's the same as 
saying that your high-level components should not depend on the low-level implementation details. 
You can use interfaces to accomplish this.
- Where possible, try to inject your dependencies instead of initializing them inside your classes. 
This usually leads to an overall better design and makes testing much more flexible and pleasant.
- As usual, favor composition over inheritance. Class hierarchies tend to become rigid and 
inflexible over time. It's usually simpler to rely on basic objects and functions that can be 
delegated or used by other classes.

## Additional Yarn scripts
You can use the following Yarn scripts to perform various useful tasks:

### `yarn check-types`
Uses the `tsc` compiler to check for errors in the TypeScript code.

### `yarn lint`
Performs code analysis in search for functional errors and potential improvements using `tslint`.

