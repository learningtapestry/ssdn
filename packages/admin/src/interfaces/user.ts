/**
 * user.ts: Interface that models an administrator user
 */

export default interface User {
  username: string;
  creationDate: Date;
  email: string;
  fullName: string;
  phoneNumber: string;
  status: string;
}
