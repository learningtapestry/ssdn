This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## End-to-end tests

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
