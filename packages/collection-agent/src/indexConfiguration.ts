/*
  This convenience file for library developers configures the parameters for
  the Nucleus collection agent static builder.

  It fetches values from the node environment at first, and overrides them with
  URL query string values if any are provided.
*/

// Initialise configuration from node env vars.
const configuration: { [k: string]: string | undefined } = {
  API_KEY: process.env.API_KEY,
  BACKEND_ADDRESS: process.env.BACKEND_ADDRESS,
  HEARTBEAT_INTERVAL: process.env.HEARTBEAT_INTERVAL,
  NAMESPACE: process.env.NAMESPACE,
  USER_HOME_PAGE: process.env.USER_HOME_PAGE,
  USER_ID: process.env.USER_ID,
};

// Override values with query-string provided parameters.
// Old IE versions prefer "document.location.search".
const qs = (document.location.search || window.location.search).substring(1);

if (qs) {
  const qsParams = qs.split("&");
  for (const qsParam of qsParams) {
    const [name, value] = qsParam.split("=");
    configuration[name] = value;
  }
}

(window as any).configuration = configuration;
