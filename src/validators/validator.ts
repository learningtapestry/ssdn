/**
 * validator.ts: Interface to provide homogeneous content validation
 */

interface Validator {
    validate(document: object): boolean;

    errors(): string[];
}
