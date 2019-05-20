import IAM from "aws-sdk/clients/iam";
import property from "lodash/fp/property";
import { parse } from "url";
import uuid from "uuid/v4";

import { API, POLICIES } from "../interfaces/aws-metadata-keys";
import { MetadataValue } from "../interfaces/base-types";
import logger from "../logger";

export default class IamService {
  private client: IAM;

  constructor(client: IAM) {
    this.client = client;
  }

  public async attachEndpointRolePolicy(
    policyArn: MetadataValue<POLICIES>,
    endpoint: MetadataValue<API>,
    externalEndpoint: string,
    externalAwsAccountId: string,
  ) {
    const roleName = this.buildRoleName(externalAwsAccountId, endpoint.value, externalEndpoint);
    await this.client
      .attachRolePolicy({
        PolicyArn: policyArn.value,
        RoleName: roleName,
      })
      .promise();
  }

  public async findOrCreateEndpointRole(
    endpoint: MetadataValue<API>,
    externalEndpoint: string,
    externalAwsAccountId: string,
  ) {
    const roleName = this.buildRoleName(externalAwsAccountId, endpoint.value, externalEndpoint);
    const role = {
      arn: "",
      externalId: "",
      name: roleName,
    };

    try {
      const response = await this.client
        .getRole({
          RoleName: roleName,
        })
        .promise();
      role.arn = response.Role.Arn;
      role.externalId = this.findRoleExternalId(response.Role.AssumeRolePolicyDocument!);
    } catch (e) {
      const externalId = uuid();
      const response = await this.client
        .createRole({
          AssumeRolePolicyDocument: JSON.stringify({
            Statement: [
              {
                Action: ["sts:AssumeRole"],
                Condition: { StringEquals: { "sts:ExternalId": externalId } },
                Effect: "Allow",
                Principal: {
                  AWS: `arn:aws:iam::${externalAwsAccountId}:root`,
                },
              },
            ],
            Version: "2012-10-17",
          }),
          RoleName: roleName,
        })
        .promise();
      role.arn = response.Role.Arn;
      role.externalId = externalId;
    }

    return role;
  }

  private buildRoleName(
    externalAwsAccountId: string,
    ownEndpoint: string,
    externalEndpoint: string,
  ) {
    return [
      "nucleus",
      "ex",
      externalAwsAccountId,
      this.getEndpointId(ownEndpoint),
      this.getEndpointId(externalEndpoint),
    ].join("_");
  }

  private getEndpointId(endpoint: string) {
    const parsed = parse(endpoint);
    return parsed.hostname!.split(".")[0];
  }

  private findRoleExternalId(policyDocumentBody: string) {
    const policyDocument = JSON.parse(decodeURIComponent(policyDocumentBody));
    const findProp = property("Condition.StringEquals.sts:ExternalId");
    const statements = Array.isArray(policyDocument.Statement)
      ? policyDocument.Statement
      : [policyDocument.Statement];
    const statement = (statements as any[]).find(
      (st) => st.Effect === "Allow" && st.Action === "sts:AssumeRole" && findProp(st),
    );
    const externalId = findProp(statement);
    if (externalId) {
      return externalId;
    }
    logger.error("Could not find the external ID for an existing policy document.");
    throw new Error("Could not find the external ID for an existing policy document.");
  }
}
