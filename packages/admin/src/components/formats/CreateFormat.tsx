import { FormikActions, withFormik } from "formik";
import isEmpty from "lodash/fp/isEmpty";
import isString from "lodash/fp/isString";
import omitBy from "lodash/fp/omitBy";
import React from "react";

import { NewDbFormat } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import FormatForm, { Schema } from "./FormatForm";

const onSubmit = async (
  values: NewDbFormat,
  { setStatus, setSubmitting, resetForm }: FormikActions<NewDbFormat>,
) => {
  try {
    const format = omitBy((value) => isString(value) && isEmpty(value))(values) as NewDbFormat;
    await AWSService.createFormat(format);
    resetForm();
    setStatus({ success: true, message: "The format has been created successfully." });
  } catch (error) {
    setStatus({ success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

const CreateFormatForm = withFormik<{}, NewDbFormat>({
  handleSubmit: onSubmit,
  mapPropsToValues: () => {
    return {
      description: "",
      name: "",
    };
  },
  validateOnChange: false,
  validationSchema: Schema,
})(FormatForm);

function CreateFormat() {
  return (
    <section id="create-format">
      <h1>Create Format</h1>
      <CreateFormatForm />
    </section>
  );
}

export default CreateFormat;
