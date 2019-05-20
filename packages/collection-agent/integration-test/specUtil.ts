import Axios from "axios";

/**
 * Builds an URL for the mock backend with a configurable test name.
 * @param testName Name for this test.
 * @param [base] The base URL.
 * @returns  The full URL.
 */
export function baseUrl(testName: string, base: string = "http://localhost:3000") {
  return `${base}/test/${testName}`;
}

/**
 * Builds an URL for the example script page, overriding the Nucleus agent
 * backend address setting to provide the test backend URL.
 * @param testName
 * @returns
 */
export function homePage(testName: string) {
  return `/?BACKEND_ADDRESS=${baseUrl(testName)}`;
}

/**
 * Fetches messages from the test backend.
 * @param [base] Base URL for the test backend.
 * @returns An array of messages.
 */
export async function getMessages(base: string = "http://localhost:3000") {
  const response = await Axios.get(`${base}/messages`);
  return response.data as any[];
}
