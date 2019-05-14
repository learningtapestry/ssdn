export const connectionRequestsPath = (endpoint: string) => `${endpoint}/connections/requests`;

export const connectionRequestVerifyPath = (endpoint: string, id: string) =>
  `${endpoint}/connections/requests/${id}/verify`;

export const connectionRequestsAcceptPath = (endpoint: string, id: string) =>
  `${endpoint}/connections/requests/${id}/accept`;

export const incomingRequestsCancelPath = (endpoint: string) =>
  `${endpoint}/connections/incoming-requests/cancel`;

export const incomingRequestsPath = (endpoint: string) =>
  `${endpoint}/connections/incoming-requests`;

export const streamsPath = (endpoint: string) => `${endpoint}/connections/streams/update`;
