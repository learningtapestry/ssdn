import IAM from "aws-sdk/clients/iam";
import property from "lodash/fp/property";
import nanoid from "nanoid";
import { parse } from "url";
import uuid from "uuid/v4";

import { AWS_SSDN, POLICIES } from "../interfaces/aws-metadata-keys";
import { MetadataValue } from "../interfaces/base-types";
import logger from "../logger";
import SSDNMetadataService from "./ssdn-metadata-service";

export interface RoleInfo {
  arn: string;
  externalId: string;
  name: string;
}

export default class IamService {
  private client: IAM;
  private metadata: SSDNMetadataService;

  constructor(client: IAM, metadata: SSDNMetadataService) {
    this.client = client;
    this.metadata = metadata;
  }

  public async attachEndpointRolePolicy(
    policyArn: MetadataValue<POLICIES>,
    externalEndpoint: string,
  ) {
    const rolePath = this.buildRolePath(
      (await this.metadata.getMetadataValue(AWS_SSDN.ssdnId)).value,
      externalEndpoint,
    );
    await this.client
      .attachRolePolicy({
        PolicyArn: policyArn.value,
        RoleName: (await this.findRoleByPath(rolePath)).RoleName,
      })
      .promise();
  }

  public async updateEndpointRoleInlinePolicy(policyDocument: any, externalEndpoint: string) {
    if (!policyDocument.Statement.length) {
      return;
    }

    const rolePath = this.buildRolePath(
      (await this.metadata.getMetadataValue(AWS_SSDN.ssdnId)).value,
      externalEndpoint,
    );

    const role = await this.findRoleByPath(rolePath);

    await this.client
      .putRolePolicy({
        PolicyDocument: JSON.stringify(policyDocument),
        PolicyName: `${role.RoleName}-Policy`,
        RoleName: role.RoleName,
      })
      .promise();
  }

  public async findOrCreateEndpointRole(externalEndpoint: string, externalAwsAccountId: string) {
    const ssdnId = (await this.metadata.getMetadataValue(AWS_SSDN.ssdnId)).value;
    const rolePath = this.buildRolePath(ssdnId, externalEndpoint);

    let role: RoleInfo;

    try {
      const existingRole = await this.findRoleByPath(rolePath);
      role = {
        arn: existingRole.Arn,
        externalId: this.findRoleExternalId(existingRole.AssumeRolePolicyDocument!),
        name: existingRole.RoleName,
      };
    } catch {
      const externalId = uuid();
      const newRole = await this.client
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
          Path: rolePath,
          RoleName: this.buildRoleName(ssdnId, externalEndpoint),
        })
        .promise();

      role = {
        arn: newRole.Role.Arn,
        externalId,
        name: newRole.Role.RoleName,
      };
    }

    return role;
  }

  private buildRolePath(ssdnId: string, externalEndpoint: string) {
    return `/ssdn/${ssdnId}/${externalEndpoint.replace(/^https?\:\/\//i, "")}/`;
  }

  private buildRoleName(ssdnId: string, externalEndpoint: string) {
    return `ssdn_ex_${ssdnId.slice(0, 14)}_${parse(externalEndpoint).hostname!.slice(
      0,
      14,
    )}_${nanoid()}`;
  }

  private async findRoleByPath(path: string) {
    const roles = await this.client
      .listRoles({
        PathPrefix: path,
      })
      .promise();

    if (!roles.Roles.length) {
      throw new Error(`Could not find role for path: ${path}`);
    }

    return roles.Roles[0]!;
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
