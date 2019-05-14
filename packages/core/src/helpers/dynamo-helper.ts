import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { NucleusError } from "../errors/nucleus-error";

export async function getOrFail<T>(
  client: DocumentClient,
  key: DocumentClient.Key,
  tableName: string,
) {
  const item = await client
    .get({
      Key: key,
      TableName: tableName,
    })
    .promise();

  if (item.Item) {
    return item.Item as T;
  }

  throw new NucleusError(`Item ${JSON.stringify(key)} not found.`, 404);
}
