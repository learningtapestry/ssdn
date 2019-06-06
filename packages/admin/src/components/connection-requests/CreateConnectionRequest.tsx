import { FormikActions, FormikProps, withFormik } from "formik";
import isEmpty from "lodash/fp/isEmpty";
import isString from "lodash/fp/isString";
import omitBy from "lodash/fp/omitBy";
import without from "lodash/fp/without";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { array, object, string } from "yup";

import { NewConnectionRequest } from "../../interfaces/connection-request";
import { Format } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

const schema = object({
  formats: array()
    .of(string().strict(true))
    .min(1),
  namespace: string(),
  organization: string().required(),
  providerEndpoint: string()
    .required()
    .url(),
});

const onSubmit = async (
  values: NewConnectionRequest,
  { setStatus, setSubmitting, resetForm }: FormikActions<NewConnectionRequest>,
) => {
  try {
    const connectionRequest = omitBy((value) => isString(value) && isEmpty(value))(
      values,
    ) as NewConnectionRequest;
    const savedRequest = await AWSService.saveConnectionRequest(connectionRequest);
    resetForm();
    setStatus({ success: true, verificationCode: savedRequest.verificationCode });
  } catch (error) {
    setStatus({ success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

function CreateConnectionRequestForm(props: FormikProps<NewConnectionRequest>) {
  const { handleSubmit, handleChange, values, errors, status, setFieldValue, setStatus } = props;

  const [formats, setFormats] = useState<Format[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFormats(await AWSService.retrieveFormats());
  };

  const displayAlert = () => {
    if (status && status.message) {
      const variant = status.success ? "success" : "danger";
      return <Alert variant={variant}>{status.message}</Alert>;
    }
  };

  const handleCloseVerificationCodeModal = useCallback(() => {
    setStatus({ success: false });
  }, []);

  const verificationCode = status && status.verificationCode ? status.verificationCode : "";

  const renderedFormats = formats.map((format) => {
    const handleChangeFormat = () => {
      if (values.formats.includes(format.name)) {
        setFieldValue("formats", without([format.name], values.formats));
      } else {
        setFieldValue("formats", values.formats.concat([format.name]));
      }
    };
    return (
      <Form.Check
        type="checkbox"
        id={format.name}
        key={format.name}
        label={format.name}
        name="formats"
        onChange={handleChangeFormat}
      />
    );
  });

  console.log(errors);

  return (
    <section id="admin-create-user">
      <h1>Data Provider Request Form</h1>
      <Row>
        <Col md={12}>
          {displayAlert()}
          <Form noValidate={true} onSubmit={handleSubmit}>
            <Form.Group controlId="providerEndpoint">
              <Form.Label>Endpoint URL</Form.Label>
              <Form.Control
                type="text"
                name="providerEndpoint"
                placeholder="https://"
                value={values.providerEndpoint}
                onChange={handleChange}
                isInvalid={!!errors.providerEndpoint}
              />
              <Form.Control.Feedback type="invalid">
                {errors.providerEndpoint}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                This URL should be provided by the Nucleus instance that owns the data.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="organization">
              <Form.Label>Organization</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="organization"
                  value={values.organization}
                  onChange={handleChange}
                  isInvalid={!!errors.organization}
                />
                <Form.Control.Feedback type="invalid">{errors.organization}</Form.Control.Feedback>
              </InputGroup>
              <Form.Text className="text-muted">
                The organization the request is associated with.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="organization">
              <Form.Label>Namespace</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="namespace"
                  value={values.namespace}
                  onChange={handleChange}
                  isInvalid={!!errors.namespace}
                />
                <Form.Control.Feedback type="invalid">{errors.namespace}</Form.Control.Feedback>
              </InputGroup>
              <Form.Text className="text-muted">
                The data namespace for the connection request. If none is provided, the default
                namespace for this instance will be used.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formats">
              <Form.Label>Formats</Form.Label>
              {renderedFormats}
              <Form.Control.Feedback
                type="invalid"
                style={{ display: !!errors.formats ? "block" : "none" }}
              >
                {errors.formats}
              </Form.Control.Feedback>
            </Form.Group>
            <Button type="submit">Send</Button>
          </Form>
          <ConfirmationModal
            title="Verification Code"
            show={status && status.success}
            onConfirm={handleCloseVerificationCodeModal}
          >
            <div>
              <p>
                You have successfully submitted your request. Use this verification code to prove
                that it is legit once you contact with the provider.
              </p>
              <h1 className="text-info text-center">{verificationCode}</h1>
            </div>
          </ConfirmationModal>
        </Col>
      </Row>
    </section>
  );
}

const CreateConnectionRequest = withFormik<{}, NewConnectionRequest>({
  handleSubmit: onSubmit,
  mapPropsToValues: () => {
    return {
      formats: [],
      namespace: "",
      organization: "",
      providerEndpoint: "",
    };
  },
  validateOnChange: false,
  validationSchema: schema,
})(CreateConnectionRequestForm);

export default CreateConnectionRequest;
