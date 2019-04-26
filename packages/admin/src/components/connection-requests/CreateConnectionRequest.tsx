import Auth from "@aws-amplify/auth";
import { FormikActions, FormikProps, withFormik } from "formik";
import { isEmpty, isString, omitBy } from "lodash/fp";
import generate from "nanoid/generate";
import React, { useCallback, useState } from "react";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import uuid from "uuid/v4";
import { object, string } from "yup";
import ConnectionRequest from "../../interfaces/connection-request";
import AWSService from "../../services/aws-service";
import ConsumerRequestService from "../../services/consumer-request-service";
import ConfirmationModal from "../ui/ConfirmationModal";

const schema = object({
  email: string()
    .required()
    .email(),
  endpoint: string()
    .required()
    .url(),
  extension: string(),
  firstName: string().required(),
  lastName: string().required(),
  organization: string().required(),
  phoneNumber: string().required(),
  title: string().required(),
});

const onSubmit = async (
  values: ConnectionRequest,
  { setStatus, setSubmitting, resetForm }: FormikActions<ConnectionRequest>,
) => {
  try {
    const connectionRequest = omitBy((value) => isString(value) && isEmpty(value))(
      values,
    ) as ConnectionRequest;
    await ConsumerRequestService.register(connectionRequest.endpoint, connectionRequest);
    await AWSService.saveConnectionRequest({ ...connectionRequest, id: uuid(), type: "provider" });
    resetForm();
    setStatus({ success: true });
  } catch (error) {
    setStatus({ success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

function CreateConnectionRequestForm(props: FormikProps<ConnectionRequest>) {
  const { handleSubmit, handleChange, values, errors, status, setStatus } = props;
  const [showVerificationCodeModal, setShowVerificationCodeModal] = useState(false);

  const displayAlert = () => {
    if (status && status.message) {
      const variant = status.success ? "success" : "danger";
      return <Alert variant={variant}>{status.message}</Alert>;
    }
  };

  const handleOpenVerificationCodeModal = useCallback(() => {
    // const title = `You have successfully submitted your request. Use this verification code to
    //                validate your requests when you get in touch with the provider`;
    // console.log((event.target as HTMLElement).dataset.verificationCode);

    setShowVerificationCodeModal(true);
  }, []);

  const handleCloseVerificationCodeModal = useCallback(() => {
    setShowVerificationCodeModal(false);
    setStatus({ success: false });
  }, []);

  return (
    <section id="admin-create-user">
      <h1>Data Provider Request Form</h1>
      <Row>
        <Col md={12}>
          {displayAlert()}
          <Form noValidate={true} onSubmit={handleSubmit}>
            <Form.Group controlId="endpoint">
              <Form.Label>Endpoint URL</Form.Label>
              <Form.Control
                type="text"
                name="endpoint"
                placeholder="https://"
                value={values.endpoint}
                onChange={handleChange}
                isInvalid={!!errors.endpoint}
              />
              <Form.Control.Feedback type="invalid">{errors.endpoint}</Form.Control.Feedback>
              <Form.Text className="text-muted">
                This URL should be provided by the Nucleus instance that owns the data.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={values.firstName}
                onChange={handleChange}
                isInvalid={!!errors.firstName}
              />
              <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="lastName">
              <Form.Label>Last Name</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  isInvalid={!!errors.lastName}
                />
                <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
              </InputGroup>
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
            <Form.Group controlId="title">
              <Form.Label>Title</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  isInvalid={!!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            <Form.Group controlId="phoneNumber">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phoneNumber"
                value={values.phoneNumber}
                onChange={handleChange}
                isInvalid={!!errors.phoneNumber}
              />
              <Form.Control.Feedback type="invalid">{errors.phoneNumber}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="extension">
              <Form.Label>Extension</Form.Label>
              <Form.Control
                type="text"
                name="extension"
                value={values.extension}
                onChange={handleChange}
                isInvalid={!!errors.extension}
              />
              <Form.Control.Feedback type="invalid">{errors.extension}</Form.Control.Feedback>
            </Form.Group>
            <Button type="submit">Send</Button>
          </Form>
          <ConfirmationModal
            title="Verification Code"
            show={showVerificationCodeModal || (status && status.success)}
            onClose={handleCloseVerificationCodeModal}
          >
            <div>
              <p>
                You have successfully submitted your request. Use this verification code to prove
                that it is legit once you contact with the provider.
              </p>
              <h1 className="text-info text-center">{values.verificationCode}</h1>
            </div>
          </ConfirmationModal>
        </Col>
      </Row>
    </section>
  );
}

const CreateConnectionRequest = withFormik<{}, ConnectionRequest>({
  handleSubmit: onSubmit,
  mapPropsToValues: () => {
    return {
      creationDate: new Date().toISOString(),
      email: "",
      endpoint: "",
      extension: "",
      firstName: "",
      id: uuid(),
      lastName: "",
      organization: "",
      phoneNumber: "",
      status: "pending",
      title: "",
      type: "consumer",
      verificationCode: generate("0123456789", 6),
    };
  },
  validateOnChange: false,
  validationSchema: schema,
})(CreateConnectionRequestForm);

export default CreateConnectionRequest;
