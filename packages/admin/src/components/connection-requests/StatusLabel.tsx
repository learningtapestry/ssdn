import React from "react";
import { Badge } from "react-bootstrap";
import { ColorVariant } from "../ui/base-types";

const statusVariants: { [k: string]: { [k: string]: { variant: ColorVariant; text: string } } } = {
  incoming: {
    accepted: {
      text: "Accepted",
      variant: "success",
    },
    accepted_pending: {
      text: "Acceptance Pending",
      variant: "warning",
    },
    canceled_consumer: {
      text: "Canceled by consumer",
      variant: "dark",
    },
    canceled_provider: {
      text: "Canceled by provider",
      variant: "dark",
    },
    created: {
      text: "Created",
      variant: "light",
    },
    pending: {
      text: "Pending",
      variant: "warning",
    },
    rejected: {
      text: "Rejected",
      variant: "danger",
    },
    rejected_pending: {
      text: "Rejection pending",
      variant: "warning",
    },
  },
  stream: {
    active: {
      text: "Active",
      variant: "success",
    },
    paused: {
      text: "Paused",
      variant: "warning",
    },
    paused_external: {
      text: "Paused (External)",
      variant: "warning",
    },
  },
  submitted: {
    accepted: {
      text: "Accepted",
      variant: "success",
    },
    canceled: {
      text: "Canceled",
      variant: "danger",
    },
    created: {
      text: "Created",
      variant: "light",
    },
    pending: {
      text: "Pending",
      variant: "warning",
    },
    rejected: {
      text: "Rejected",
      variant: "danger",
    },
  },
};

interface StatusLabelProps {
  status: string;
  statusType: "incoming" | "submitted" | "stream";
}

export function StatusLabel(props: StatusLabelProps) {
  const { text, variant } = statusVariants[props.statusType][props.status];

  return (
    <Badge pill={true} variant={variant}>
      {text}
    </Badge>
  );
}
