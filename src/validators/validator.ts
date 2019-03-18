/**
 * validator.ts: Interface to provide homogeneous content validation
 */

interface Validator {
    validate(document: object, rootElement: string): boolean;

    errors(): string[];
}
