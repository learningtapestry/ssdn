import Auth from "@aws-amplify/auth";

const ensure = (env: NodeJS.ProcessEnv, k: string) => {
  const v = env[k];
  if (!v) {
    throw new Error(`Key not found: ${k}`);
  }
  return v;
};

const awsapi = {
  endpoints: [
    {
      custom_header: async () => {
        return {
          Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
          "Content-Type": "application/json",
        };
      },
      endpoint: ensure(process.env, "REACT_APP_ENDPOINT"),
      name: "ExchangeApi",
    },
    {
      endpoint: ensure(process.env, "REACT_APP_ENDPOINT"),
      name: "ExchangeApiSigv4",
    },
  ],
};

const awsconfiguration = {
  Api: awsapi,
  Auth: {
    identityPoolId: ensure(process.env, "REACT_APP_IDENTITY_POOL_ID"),
    nucleusId: ensure(process.env, "REACT_APP_NUCLEUS_ID"),
    region: ensure(process.env, "REACT_APP_AWS_REGION"),
    stackName: ensure(process.env, "REACT_APP_STACK_NAME"),
    userPoolId: ensure(process.env, "REACT_APP_USER_POOL_ID"),
    userPoolWebClientId: ensure(process.env, "REACT_APP_USER_POOL_WEB_CLIENT_ID"),
  },
  Storage: {
    nucleusConnectionRequests: `Nucleus-${ensure(
      process.env,
      "REACT_APP_NUCLEUS_ID",
    )}-ConnectionRequests`,
    nucleusConnections: `Nucleus-${ensure(process.env, "REACT_APP_NUCLEUS_ID")}-Connections`,
    nucleusIncomingConnectionRequests: `Nucleus-${ensure(
      process.env,
      "REACT_APP_NUCLEUS_ID",
    )}-IncomingConnectionRequests`,
  },
};

export default awsconfiguration;
