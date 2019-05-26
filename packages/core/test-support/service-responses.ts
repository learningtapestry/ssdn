/**
 * service-responses.ts: Collection of objects that mock the responses of external services
 */

export function assumeRole() {
  return {
    AssumedRoleUser: {
      Arn: "arn:aws:sts::123456789012:assumed-role/demo/Bob",
      AssumedRoleId: "ARO123EXAMPLE123:Bob",
    },
    Credentials: {
      AccessKeyId: "AKIAIOSFODNN7EXAMPLE",
      Expiration: "2011-07-15T23:28:33.359Z",
      SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
      SessionToken: `AQoDYXdzEPT//////////wEXAMPLEtc764bNrC9SAPBSM22wDOk4x4HIZ8j4FZTwdQWLWsKWHGBuFq
wAeMicRXmxfpSPfIeoIYRqTflfKD8YUuwthAx7mSEI/qkPpKPi/kMcGdQrmGdeehM4IC1NtBmUpp2wUE8phUZampKsburEDy0KPk
yQDYwT7WZ0wq5VSXDvp75YU9HFvlRd8Tx6q6fE8YQcHNVXAkiY9q6d+xo0rKwT38xVqr7ZD0u0iPPkUL64lIZbqBAz+scqKmlzm8
FDrypNC9Yjc8fPOLn9FX9KSYvKTr4rvx3iSIlTJabIQwj2ICCR/oLxBA==`,
    },
    PackedPolicySize: 6,
  };
}
