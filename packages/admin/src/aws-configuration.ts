import Auth from "@aws-amplify/auth";

const env = {
  cypress: (k: string) => (window as any).Cypress.env(k),
  none: (k: string) => {},
  process: (k: string) => process.env[k],
}[Object.keys(process.env).length ? "process" : (window as any).Cypress ? "cypress" : "none"];

export function ensure(k: string) {
  const v = env(k);
  if (!v) {
    throw new Error(`Key not found: ${k}`);
  }
  return v;
}

const awsapi = {
  endpoints: [
    {
      custom_header: async () => {
        return {
          Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
          "Content-Type": "application/json",
        };
      },
      endpoint: ensure("REACT_APP_ENDPOINT"),
      name: "ExchangeApi",
    },
    {
      endpoint: ensure("REACT_APP_ENDPOINT"),
      name: "ExchangeApiSigv4",
    },
  ],
};

const ENV = process.env ? process.env : (window as any).Cypress ? (window as any).Cypress : {};

const awsconfiguration = {
  Api: awsapi,
  Auth: {
    identityPoolId: ensure("REACT_APP_IDENTITY_POOL_ID"),
    nucleusId: ensure("REACT_APP_NUCLEUS_ID"),
    region: ensure("REACT_APP_AWS_REGION"),
    stackName: ensure("REACT_APP_STACK_NAME"),
    userPoolId: ensure("REACT_APP_USER_POOL_ID"),
    userPoolWebClientId: ensure("REACT_APP_USER_POOL_WEB_CLIENT_ID"),
  },
  Storage: {
    nucleusConnectionRequests: `Nucleus-${ensure("REACT_APP_NUCLEUS_ID")}-ConnectionRequests`,
    nucleusConnections: `Nucleus-${ensure("REACT_APP_NUCLEUS_ID")}-Connections`,
    nucleusIncomingConnectionRequests: `Nucleus-${ensure(
      "REACT_APP_NUCLEUS_ID",
    )}-IncomingConnectionRequests`,
  },
};

export default awsconfiguration;
