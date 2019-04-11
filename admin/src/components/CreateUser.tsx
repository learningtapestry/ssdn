import { FormikActions, FormikProps, withFormik } from "formik";
import React from "react";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { object, string } from "yup";
import UserForm from "../interfaces/user-form";
import AWSService from "../services/aws-service";

const schema = object({
  email: string()
    .required()
    .email(),
  name: string().required(),
  password: string().required(),
  phoneNumber: string().required(),
  username: string().required(),
});

const onSubmit = async (
  values: UserForm,
  { setStatus, setSubmitting }: FormikActions<UserForm>,
) => {
  try {
    await AWSService.createUser({
      email: values.email,
      name: values.name,
      password: values.password,
      phoneNumber: values.phoneNumber,
      username: values.username,
    });
    setStatus({ success: true, message: "User created successfully!" });
  } catch (error) {
    setStatus({ success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

function CreateUserForm(props: FormikProps<UserForm>) {
  const { handleSubmit, handleChange, values, errors, status } = props;

  const displayAlert = () => {
    if (status && status.message) {
      const variant = status.success ? "success" : "danger";
      return <Alert variant={variant}>{status.message}</Alert>;
    }
  };

  return (
    <section id="admin-create-user">
      <h1>New Administrator User</h1>
      <Row>
        <Col md={12}>
          {displayAlert()}
          <Form noValidate={true} onSubmit={handleSubmit}>
            <Form.Group controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={values.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
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
            <Form.Group controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
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
            <Button type="submit">Create</Button>
          </Form>
        </Col>
      </Row>
    </section>
  );
}

const CreateUser = withFormik<{}, UserForm>({
  handleSubmit: onSubmit,
  mapPropsToValues: () => {
    return {
      email: "",
      name: "",
      password: "",
      phoneNumber: "",
      username: "",
    };
  },
  validationSchema: schema,
})(CreateUserForm);

export default CreateUser;
