/**
 * An user or actor, _in the context of a SSDN message_.
 * In xApi, equivalent to an "actor" - one who performs an action.
 * May represent someone who is logged into a system, or even an
 * anonymous browser user.
 */
export interface User {
  /**
   * An unique identifier for the user. Could be a numeric ID or even an e-mail.
   */
  id: string;

  /**
   * A free-form object for holding additional information about the user.
   */
  extensions?: object;
}
