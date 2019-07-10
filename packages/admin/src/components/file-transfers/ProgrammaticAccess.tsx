import React, { useEffect, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import atom from "react-syntax-highlighter/dist/styles/hljs/atom-one-dark";
import UploadCredentialsService from "../../services/upload-credentials-service";

export default function ProgrammaticAccess() {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const uploadCredentialsService = new UploadCredentialsService();
    setApiKey(await uploadCredentialsService.apiKey());
    setEndpoint(await uploadCredentialsService.endpoint());
  };

  const axiosCode = `const axios = require("axios");
const querystring = require("querystring");
        
const endpoint = $ENDPOINT;
const apiKey = $API_KEY;
const client = "ssdn.learningtapestry.com";
const format = "xAPI";
  
axios.post(endpoint, querystring.stringify({ client, format })).then((response) => {
  console.log(response);
}).catch(error) => {
  console.log(error);
});`;

  return (
    <section id="admin-file-transfers-notifications">
      <h1>Programmatic Access</h1>
      <p>
        You can also generate temporary upload credentials by programmatically calling the endpoint.
        Take a look at the following examples to get a better idea of how to achieve it.
      </p>

      <h2>Instance values</h2>
      <p>
        These are the values that belong to this SSDN instance. Make sure to replace the
        placeholders with them when you make the actual call.
      </p>
      <p>
        <strong>Endpoint:</strong> <code>{endpoint}</code>
      </p>
      <p>
        <strong>API Key:</strong> <code>{apiKey}</code>
      </p>
      <hr />
      <h3>Using cURL</h3>
      <SyntaxHighlighter language="bash" style={atom}>
        curl --data 'client=ssdn.learningtapestry.com' --data 'format=xAPI' --header
        'X-Api-Key:$API_KEY' $ENDPOINT
      </SyntaxHighlighter>
      <h3>Using HTTPie</h3>
      <SyntaxHighlighter language="bash" style={atom}>
        http -f POST $ENDPOINT client=ssdn.learningtapestry.com format=xAPI X-Api-Key:$API_KEY
      </SyntaxHighlighter>
      <h3>Using Node</h3>
      <SyntaxHighlighter language="javascript" style={atom}>
        {axiosCode}
      </SyntaxHighlighter>
    </section>
  );
}
