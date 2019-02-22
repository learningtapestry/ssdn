import nucleusEventSample from "../../../test-support/data-samples/nucleus-event.json";
import processEventInput from "../../../test-support/lambda-events/process-event-api-gateway.json";
import LambdaEventParser from "./lambda-event-parser";

describe("LambdaEventParser", () => {
    describe("parse", () => {
        it("generates a nucleus event structured object", async () => {
            const nucleusEvent = new LambdaEventParser(processEventInput).parse();

            expect(nucleusEvent).toEqual(nucleusEventSample);
        });

        it("does not try to decode content when flag is not set", async () => {
            const unencodedEventInput = processEventInput;
            unencodedEventInput.body = JSON.stringify({content: "My content"});
            unencodedEventInput.isBase64Encoded = false;

            const nucleusEvent = new LambdaEventParser(unencodedEventInput).parse();

            expect(JSON.parse(nucleusEvent.content)).toEqual({content: "My content"});
        });
    });
});
