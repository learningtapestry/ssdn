import React from "react";
import ConnectionRequests from "./ConnectionRequests";

export default function Consumers() {
  return (
    <ConnectionRequests
      type="consumer"
      title="Consumers"
      description="This section displays the connections you have allowed to other instances."
    />
  );
}
