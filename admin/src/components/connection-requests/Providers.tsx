import React from "react";
import ConnectionRequests from "./ConnectionRequests";

export default function Providers() {
  return (
    <ConnectionRequests
      type="provider"
      title="Providers"
      description="This section displays the connections you're subscribed to."
    />
  );
}
