import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { extname } from "path";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import config from "../config";
import AWSService from "../services/aws-service";
import "./Producer.css";

const Producer: React.FC = () => {
  const [lmsName, setLmsName] = useState("");
  const [uploadSuccessful, setUploadSuccessful] = useState({
    direct: false,
    enrollments: false,
    results: false,
  });

  useEffect(() => {
    document.getElementById("video")!.style.display = "block";
    return () => {
      document.getElementById("video")!.style.display = "none";
    };
  });

  const handleUpload = useCallback(
    (event: any) => {
      const target = event.target;
      if (!target.files[0]) {
        return;
      }
      const reader = new FileReader();
      let fileName: string;
      if (target.dataset.mode === "direct" && lmsName) {
        fileName = `${lmsName.split(" ").join("_")}${extname(target.files[0].name)}`;
      } else {
        fileName = target.files[0].name;
      }
      reader.onload = async () => {
        await AWSService.uploadFile(
          reader.result!,
          `${config.namespace}/${config.format}/${fileName}`,
        );
        setUploadSuccessful({ ...uploadSuccessful, [target.dataset.mode]: true });
      };
      reader.readAsArrayBuffer(target.files[0]);
    },
    [lmsName, uploadSuccessful],
  );

  const handleChange = useCallback((event: any) => {
    setLmsName(event.target.value);
  }, []);

  return (
    <div className="Producer">
      <section>
        <h1>LMS: Submit Assignment: Bird Project</h1>
        <div>
          <input
            type="text"
            name="lms-name"
            required={true}
            placeholder="Enter Your Name"
            value={lmsName}
            onChange={handleChange}
          />
        </div>
        <div className="upload-wrapper">
          <Button variant="primary" className="float-right">
            Upload File
          </Button>
          <input type="file" name="lms-file" onChange={handleUpload} data-mode="direct" />
          {uploadSuccessful.direct && (
            <FontAwesomeIcon icon={faCheckCircle} size="2x" className="upload-success" />
          )}
        </div>
      </section>
      <section>
        <h1>SIS: Administrative Action: New Enrollments</h1>
        <div className="upload-wrapper">
          <Button variant="primary" className="text-right">
            Upload File
          </Button>
          <input
            type="file"
            name="one-roster-enrollments-file"
            onChange={handleUpload}
            data-mode="enrollments"
          />
          {uploadSuccessful.enrollments && (
            <FontAwesomeIcon icon={faCheckCircle} size="2x" className="upload-success" />
          )}
        </div>
      </section>
      <section>
        <h1>Digital Tool: Third Party Data: Assessment Results</h1>
        <div className="upload-wrapper">
          <Button variant="primary">Upload File</Button>
          <input
            type="file"
            name="one-roster-results-file"
            onChange={handleUpload}
            data-mode="results"
          />
          {uploadSuccessful.results && (
            <FontAwesomeIcon icon={faCheckCircle} size="2x" className="upload-success" />
          )}
        </div>
      </section>
    </div>
  );
};

export default Producer;
