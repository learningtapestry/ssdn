export function mockClient(clientDef: () => object) {
  const client = clientDef();
  const promiseMethods: { [k: string]: (params: any) => any } = {};
  for (const [fnName, fnDef] of Object.entries(client)) {
    promiseMethods[fnName] = (params: any) => {
      return {
        promise: () => {
          return new Promise((resolve, reject) => {
            try {
              resolve(fnDef(params));
            } catch (e) {
              reject(e);
            }
          });
        },
      };
    };
  }
  const promiseClient = () => {
    // Empty
  };
  promiseClient.prototype = promiseMethods;
  return promiseClient;
}

export function mockPromise(fnDef: (p1: any) => any) {
  return (params: any) => ({
    promise: () => {
      return new Promise((resolve, reject) => {
        try {
          resolve(fnDef(params));
        } catch (e) {
          reject(e);
        }
      });
    },
  });
}
