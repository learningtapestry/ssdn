// @ts-ignore
process.env.REACT_APP_ENDPOINT = "https://localhost";
process.env.REACT_APP_IDENTITY_POOL_ID = "us-east-1:test-test-test-test-test";
process.env.REACT_APP_SSDN_ID = "SSDN";
process.env.REACT_APP_AWS_REGION = "us-east-1";
process.env.REACT_APP_STACK_NAME = "SSDN";
process.env.REACT_APP_USER_POOL_ID = "us-east-1_asdfghj";
process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID = "nr927he19e7y9y2918j87gfawoij";

if ((global as any).document) {
  // Apparently, document.createRange is used by react-testing-library but is not
  // present in jest-dom.
  // Let's define it here.
  // Ref https://stackoverflow.com/questions/51887552/jest-enzyme-document-createrange-is-not-a-function-on-mount
  (global as any).document.createRange = () => ({
    commonAncestorContainer: {
      nodeName: "BODY",
      ownerDocument: document,
    },
    setEnd: () => {},
    setStart: () => {},
  });
}
