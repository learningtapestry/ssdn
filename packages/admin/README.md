# SSDN Administration Panel

Thic component provides a front-end web application that lets you manage and configure a running SSDN instance.

## Main dependencies and tools

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Other tools used
alongside this framework are:

- [Yarn](https://yarnpkg.com/en/): manages dependencies and project scripts.
- [TypeScript](https://www.typescriptlang.org/): is used as the default implementation language.
- [AWS Amplify](https://aws-amplify.github.io/): provides the backbone for the back-end services and AWS integrations.

## Requirements

As with every JavaScript front-end project, make sure you have installed an up-to-date version of
[Node.js](https://nodejs.org/en/download/), preferably version 10.16 or higher, as well
as [Yarn](https://yarnpkg.com/en/).

Next, you need to install the AWS Amplify CLI package globally in your system.

```bash
yarn global add @aws-amplify/cli
```

## Project layout

```bash
admin
├── amplify/                            <-- Settings created and managed by Amplify
├── build/                              <-- Output folder that contains the generated build
├── cypress/                            <-- Contains the end-to-end tests
├── public/                             <-- Basic files to boostrap the application inside the browser
├── src/                                <-- Main source folder
│   ├── components/                     <-- Contains the React UI components
│   ├── interfaces/                     <-- TypeScript definitions for application objects
│   ├── services/                       <-- Service objects that usually communicate with external resources
│   ├── types/                          <-- Specific TypeScript types for libraries that do not include them
│   ├── App.tsx                         <-- Main application React component
│   ├── app-helper.ts                   <-- Main application helper with utility functions
│   ├── aws-configuration.ts            <-- Sets up the main admin panel configuration
│   ├── aws-exports.js                  <-- Auto-generated file by AWS Amplify that contains the current configuration
│   └── setupTests.ts                   <-- Prepares the environment to run the tests
├── test-support/                       <-- Support files and code useful for testing
├── .env.template                       <-- Template file that declares environment variables for the project
├── cypress.json                        <-- Configuration file for the Cypress test runner
├── package.json                        <-- Node.js dependencies
├── README.md                           <-- This file
├── tsconfig.json                       <-- Configuration file for the TypeScript compiler
└── tslint.json                         <-- Configuration file for the TypeScript linter
```

## Setup

Run the following command to install the project dependencies:

```bash
yarn install
```

Next, create a local copy of the configuration file.

```bash
cp .env.template .env
```

We've developed the admin panel application in a way that it can easily point to any running SSDN instance. This
integration is performed via environment variables, so you'll need to enter the correct values from your SSDN instance.
Most of them can be obtained from the CloudFormation template associated with the SSDN Core.

Here is a brief description of the environment variables you'll need to configure. Inside parenthesis you'll find the
actual CloudFormation resource used by the SSDN Core stack:

- **`REACT_APP_ENDPOINT`**: points to the Exchange API endpoint. It's used for door-knocking and sharing
  data (`ExchangeApi`).
- **`REACT_APP_ENTITIES_ENDPOINT`**: points to the Entities API endpoint. (`EntitiesApi`).
- **`REACT_APP_FILE_TRANSFER_NOTIFICATIONS_ENDPOINT`**: points to the File Transfer Notifications API endpoint
  (`FileTransferNotificationsApi`).
- **`REACT_APP_SQS_INTEGRATION_NOTIFICATIONS_ENDPOINT`**: points to the SQS Integration Notifications API endpoint
  (`SQSIntegrationNotificationsApi`).
- **`REACT_APP_IDENTITY_POOL_ID`**: The Cognito Identity Pool ID (`CognitoIdentityPool`).
- **`REACT_APP_SSDN_ID`**: The SSDN ID. It's usually assigned by you, or the CLI installer (`SSDNId`).
- **`REACT_APP_AWS_REGION`**: The AWS region, usually `us-east-1`.
- **`REACT_APP_STACK_NAME`**: The name of the SSDN Core stack.
- **`REACT_APP_USER_POOL_ID`**: The ID of the Cognito User Pool (`CognitoUserPool`).
- **`REACT_APP_USER_POOL_WEB_CLIENT_ID`**: The ID of the web client in the user pool (`CognitoUserPoolClientWeb`).

The last step involves configuring and initializing the Amplify environment. Run:

```bash
amplify configure
```

Follow the steps that will guide you through the creation of a suitable AWS account, as well as setting up your
preferred environment.

Next, run:

```bash
amplify init
```

When it asks whether you want to use an existing environment, choose `No` unless you're sure that you want to reuse the
development environment available in the code repository. In almost all cases, the safest choice is setting up a new
environment in your AWS account.

To learn more about the many options to set up an Amplify project, feel free to look at the official documentation on
[Environments & Teams](https://aws-amplify.github.io/docs/cli-toolchain/quickstart#environments--teams).

## Usage

Since this is a regular Amplify project, you can use the expected commands to manage the project:

- `amplify push` to provision the AWS resources in the cloud.
- `amplify publish` to generate a production-ready build of the admin panel and upload it to S3.
- `amplify serve` to start a local instance of the application.
- `amplify status` to get a general overview of the project and its resources.

## Testing

Create React Application uses `jest` as the default test runner.

### Unit tests

```bash
yarn test
```

This will run all the unit tests. By default they are started in `watch` mode.

### End-to-end tests

We use [Cypress](https://www.cypress.io/) to execute the tests that check the behaviour of the
admin panel from the point of view of an external user. In order to run them properly, we make some
assumptions that require following these configuration steps:

- First of all, the actual resources must be deployed to AWS. Any environment will do, but we
  recommend creating a new fresh environment in Amplify that is specific to testing:

```bash
amplify env add     # Use 'test', 'cypress' or 'e2e' as the environment name when it asks
amplify serve       # Provisions the resources in the cloud and starts the application locally
```

- Make sure you have defined proper values for the current environment in the `.env` file, and that
  it's pointing to the environment you want to run the e2e tests on.

- Now, you'll need to create a default administrator user that will be used to sign in. Again, you can
  either go to the Cognito section in the AWS Console and create the user there, or run the
  following command:

```bash
aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_jV9AzgY8g \
    --username test-user \
    --temporary-password @Mb94TQT5nqE \
    --user-attributes Name=email,Value=test-user@example.org \
                      Name=email_verified,Value=true \
                      Name=name,Value="Test User" \
                      Name=phone_number,Value=+1555555555 \
                      Name=phone_number_verified,Value=true
```

_Note: Make sure you use the same values as shown above when you create your test user. Otherwise some tests might
fail._

- Next step is passing Cypress some configuration values that are needed for the actual tests. We
  use environment variables for that. Please check the
  [official documentation](https://docs.cypress.io/guides/guides/environment-variables.html#Setting)
  on the various ways to set environment variables in Cypress. You can choose whatever works best
  for you, but in this example we'll just export them to the system:

```bash
export CYPRESS_DEFAULT_USERNAME=test-user
export CYPRESS_DEFAULT_PASSWORD=@Mb94TQT5nqE
export CYPRESS_REGISTER_ENDPOINT=https://z0krjz1z0l.execute-api.us-east-1.amazonaws.com/test/register
```

As you can see, all variables must start with `CYPRESS_` in order to be properly recognized.
Besides that, we're declaring the username and password we defined in the previous step, as well as
the register endpoint for consumer requests. If you don't know where this value comes from, you can
use your instance's own endpoint. Check the home page in your SSDN administration panel or the
CloudFormation stack in your AWS account to get the endpoint's URL.

- Lastly, you can launch the end-to-end tests with these two commands:

```bash
yarn cypress:open       # Opens up an interactive GUI and runs in a graphical browser
yarn cypress:run        # Runs in a headless browser (Electron) without user intervention
```
