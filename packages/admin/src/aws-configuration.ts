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
    {
      custom_header: async () => {
        return {
          Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
          "Content-Type": "application/json",
        };
      },
      endpoint: ensure("REACT_APP_ENTITIES_ENDPOINT"),
      name: "EntitiesApi",
    },
    {
      custom_header: async () => ({
        Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
        "Content-Type": "application/json",
      }),
      endpoint: ensure("REACT_APP_FILE_TRANSFER_NOTIFICATIONS_ENDPOINT"),
      name: "FileTransferNotificationsApi",
    },
    {
      custom_header: async () => ({
        Authorization: (await Auth.currentSession()).getIdToken().getJwtToken(),
        "Content-Type": "application/json",
      }),
      endpoint: ensure("REACT_APP_SQS_INTEGRATION_NOTIFICATIONS_ENDPOINT"),
      name: "SQSIntegrationNotificationsApi",
    },
  ],
};

const awsconfiguration = {
  Api: awsapi,
  Auth: {
    identityPoolId: ensure("REACT_APP_IDENTITY_POOL_ID"),
    region: ensure("REACT_APP_AWS_REGION"),
    ssdnId: ensure("REACT_APP_SSDN_ID"),
    stackName: ensure("REACT_APP_STACK_NAME"),
    userPoolId: ensure("REACT_APP_USER_POOL_ID"),
    userPoolWebClientId: ensure("REACT_APP_USER_POOL_WEB_CLIENT_ID"),
  },
  Storage: {
    ssdnConnectionRequests: `SSDN-${ensure("REACT_APP_SSDN_ID")}-ConnectionRequests`,
    ssdnConnections: `SSDN-${ensure("REACT_APP_SSDN_ID")}-Connections`,
    ssdnFormats: `SSDN-${ensure("REACT_APP_SSDN_ID")}-Formats`,
    ssdnIncomingConnectionRequests: `SSDN-${ensure(
      "REACT_APP_SSDN_ID",
    )}-IncomingConnectionRequests`,
  },
};

export default awsconfiguration;
