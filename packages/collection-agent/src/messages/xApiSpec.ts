export interface XApiActor {
  objectType: "Agent";
  account?: object;
}

export interface XApiVerb {
  id: string;
}

export interface XApiObject {
  objectType: "Activity";
  id: string;
  definition?: object;
  [key: string]: any;
}

export interface XApiContext {
  extensions: {
    [key: string]: any;
  };
}

export interface XApiMessage {
  actor: XApiActor;
  verb: XApiVerb;
  object: XApiObject;
  context?: XApiContext;
}
