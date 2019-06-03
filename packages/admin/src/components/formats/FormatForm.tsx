import { FormikProps } from "formik";
import React from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { object, string } from "yup";

import { NewDbFormat } from "../../interfaces/format";

export const Schema = object({
  description: string().notRequired(),
  name: string().required(),
});

function FormatForm(props: FormikProps<NewDbFormat>) {
  const { handleSubmit, handleChange, values, errors, status, setStatus } = props;

  const displayAlert = () => {
    if (status && status.message) {
      const variant = status.success ? "success" : "danger";
      return <Alert variant={variant}>{status.message}</Alert>;
    }
  };

  return (
    <Row>
      <Col md={12}>
        {displayAlert()}
        <Form noValidate={true} onSubmit={handleSubmit}>
          <Form.Group controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="xAPI"
              value={values.name}
              onChange={handleChange}
              isInvalid={!!errors.name}
              disabled={status && !!status.isEditForm}
            />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            <Form.Text className="text-muted">An unique name that identifies the format.</Form.Text>
          </Form.Group>
          <Form.Group controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              name="description"
              placeholder=""
              value={values.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
            <Form.Text className="text-muted">A description for the format.</Form.Text>
          </Form.Group>
          <Button type="submit">Submit</Button>
        </Form>
      </Col>
    </Row>
  );
}

export default FormatForm;
