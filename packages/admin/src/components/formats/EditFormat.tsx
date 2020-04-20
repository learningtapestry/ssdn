import { FormikActions, withFormik } from "formik";
import isEmpty from "lodash/fp/isEmpty";
import isString from "lodash/fp/isString";
import omitBy from "lodash/fp/omitBy";
import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";

import { Format, NewFormat } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import FormatForm, { Schema } from "./FormatForm";

const onSubmit = async (
  values: NewFormat,
  { setStatus, setSubmitting, resetForm }: FormikActions<NewFormat>,
) => {
  try {
    const format = omitBy((value) => isString(value) && isEmpty(value))(values) as Format;
    resetForm(await AWSService.updateFormat(format));
    setStatus({
      isEditForm: true,
      message: "The format has been updated successfully.",
      success: true,
    });
  } catch (error) {
    setStatus({ isEditForm: true, success: false, message: error.message });
  } finally {
    setSubmitting(false);
  }
};

const EditFormatForm = withFormik<{ format: NewFormat }, NewFormat>({
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
  const [format, setFormat] = useState<Format>({
    creationDate: "",
    description: "",
    name: "",
    updateDate: "",
  });

  const name = props.match.params.name;

  useEffect(() => {
    const fetchFormat = async () => {
      setFormat(await AWSService.retrieveFormat(name));
    };

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
