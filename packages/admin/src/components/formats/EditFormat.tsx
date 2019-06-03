import { FormikActions, withFormik } from "formik";
import isEmpty from "lodash/fp/isEmpty";
import isString from "lodash/fp/isString";
import omitBy from "lodash/fp/omitBy";
import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";

import { DbFormat, NewDbFormat } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import FormatForm, { Schema } from "./FormatForm";

const onSubmit = async (
  values: NewDbFormat,
  { setStatus, setSubmitting, resetForm }: FormikActions<NewDbFormat>,
) => {
  try {
    const format = omitBy((value) => isString(value) && isEmpty(value))(values) as NewDbFormat;
    resetForm(await AWSService.updateFormat(format));
    setStatus({
      isEditForm: true,
      success: true,
      message: "The format has been updated successfully.",
    });
  } catch (error) {
    setStatus({ isEditForm: true, success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

const EditFormatForm = withFormik<{ format: NewDbFormat }, NewDbFormat>({
  enableReinitialize: true,
  handleSubmit: onSubmit,
  mapPropsToStatus: () => ({ isEditForm: true }),
  mapPropsToValues: (props) => ({ ...props.format }),
  validateOnChange: false,
  validationSchema: Schema,
})(FormatForm);

interface EditFormatProps {
  name: string;
}

function EditFormat(props: RouteComponentProps<EditFormatProps>) {
  const [format, setFormat] = useState<DbFormat>({
    creationDate: "",
    name: "",
    updateDate: "",
  });

  const fetchFormat = async () => {
    setFormat(await AWSService.retrieveFormat(props.match.params.name));
  };

  const name = props.match.params.name;

  useEffect(() => {
    fetchFormat();
  }, [name]);

  return (
    <section id="create-format">
      <h1>Edit Format</h1>
      <EditFormatForm format={format} />
    </section>
  );
}

export default EditFormat;
