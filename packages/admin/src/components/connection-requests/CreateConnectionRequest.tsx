import { FormikActions, FormikProps, withFormik } from "formik";
import isEmpty from "lodash/fp/isEmpty";
import isString from "lodash/fp/isString";
import omitBy from "lodash/fp/omitBy";
import React, { useCallback } from "react";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { object, string } from "yup";

import { NewConnectionRequest } from "../../interfaces/connection-request";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

const schema = object({
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
  const { handleSubmit, handleChange, values, errors, status, setStatus } = props;

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
      organization: "",
      providerEndpoint: "",
    };
  },
  validateOnChange: false,
  validationSchema: schema,
})(CreateConnectionRequestForm);

export default CreateConnectionRequest;
