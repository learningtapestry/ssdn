import filenamify from "filenamify";
import { FormikActions, FormikProps, withFormik } from "formik";
import has from "lodash/fp/has";
import React, { useEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { object, string } from "yup";

import { Format } from "../../interfaces/format";
import UploadCredentialsForm from "../../interfaces/upload-credentials-form";
import AWSService from "../../services/aws-service";
import UploadCredentialsService from "../../services/upload-credentials-service";

const schema = object({
  client: string().required(),
  format: string().required(),
});

const onSubmit = async (
  values: UploadCredentialsForm,
  { setStatus, setSubmitting }: FormikActions<UploadCredentialsForm>,
) => {
  try {
    const credentials = await new UploadCredentialsService().generate(values.client, values.format);
    setStatus({ credentials });
  } catch (error) {
    setStatus({ message: error.message });
  } finally {
    setSubmitting(false);
  }
};

function CreateUploadCredentialsForm(props: FormikProps<UploadCredentialsForm>) {
  const { handleSubmit, handleChange, values, errors, status } = props;
  const [formats, setFormats] = useState<Format[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFormats(await AWSService.retrieveFormats());
  };

  const renderCredentials = () => {
    if (!status) {
      return;
    }

    if (has("credentials")(status)) {
      return (
        <div>
          <Alert variant="success">
            Your temporary S3 credentials have been generated successfully!
          </Alert>
          <p>
            Keep in mind they are only valid to upload files inside the{" "}
            <strong>
              '{filenamify(values.client, { replacement: "__" })}/{values.format}'
            </strong>{" "}
            folder, and that they will expire in <strong>1 hour</strong>.
          </p>
          <p>
            Please see the official{" "}
            <a href="https://docs.aws.amazon.com/cli/latest/userguide/">AWS documentation</a> for
            ways to configure your S3 client.
          </p>
          <p className="mb-0">
            <strong>Access Key ID</strong>
          </p>
          <p>
            <code>{status.credentials.accessKeyId}</code>
          </p>
          <p className="mb-0">
            <strong>Secret Access Key</strong>
          </p>
          <p>
            <code>{status.credentials.secretAccessKey}</code>
          </p>
          <p className="mb-0">
            <strong>Session Token</strong>
          </p>
          <p>
            <code>{status.credentials.sessionToken}</code>
          </p>
        </div>
      );
    } else {
      return (
        <Alert variant="danger" className="mt-2">
          {status.message}
        </Alert>
      );
    }
  };

  const formatOptions = () =>
    formats.map((format) => <option key={format.name}>{format.name}</option>);

  const renderForm = () => (
    <Form noValidate={true} onSubmit={handleSubmit}>
      <Form.Group controlId="client">
        <Form.Label>Namespace</Form.Label>
        <Form.Control
          type="text"
          name="client"
          value={values.client}
          onChange={handleChange}
          isInvalid={!!errors.client}
        />
        <Form.Control.Feedback type="invalid">{errors.client}</Form.Control.Feedback>
        <Form.Text className="text-muted">
          This value corresponds to the namespace identified with the data you will be sharing.
        </Form.Text>
        <Form.Text className="text-muted">
          For example, it could be an organizational namespace in the format of
          "mydatatype.myorganization.com".
        </Form.Text>
      </Form.Group>
      <Form.Group controlId="format">
        <Form.Label>Format</Form.Label>
        <Form.Control
          as="select"
          name="format"
          value={values.format}
          onChange={handleChange}
          isInvalid={!!errors.format}
        >
          {formatOptions()}
        </Form.Control>
        <Form.Control.Feedback type="invalid">{errors.format}</Form.Control.Feedback>
      </Form.Group>
      <Button type="submit">Generate</Button>
    </Form>
  );

  return (
    <section id="admin-upload-credentials">
      <h1>Generate Upload Credentials</h1>
      <p>
        Here you can generate temporary AWS credentials that will allow you to upload and share
        files with other Nucleus instances.
      </p>
      {!has("credentials")(status) && renderForm()}
      {renderCredentials()}
    </section>
  );
}

const CreateUploadCredentials = withFormik<{}, UploadCredentialsForm>({
  handleSubmit: onSubmit,
  mapPropsToValues: () => {
    return {
      client: "",
      format: "xAPI",
    };
  },
  validateOnChange: false,
  validationSchema: schema,
})(CreateUploadCredentialsForm);

export default CreateUploadCredentials;
