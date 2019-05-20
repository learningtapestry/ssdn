import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

import { nullInstance } from "../../app-helper";
import Instance from "../../interfaces/instance";
import Setting from "../../interfaces/setting";
import AWSService from "../../services/aws-service";

interface SettingsTableProps {
  settings: Setting[];
}

function SettingsTable(props: SettingsTableProps) {
  const renderSettings = () =>
    props.settings.map((setting) => (
      <tr key={setting.key}>
        <td>{setting.key}</td>
        <td>{setting.description}</td>
        <td>{linkedValue(setting.value)}</td>
      </tr>
    ));

  const linkedValue = (value?: string) => {
    if (value && value.startsWith("http")) {
      return <a href={value}>{value}</a>;
    } else {
      return <p>{value}</p>;
    }
  };

  return (
    <Table striped={true} hover={true} className="mt-3">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>{renderSettings()}</tbody>
    </Table>
  );
}

export default function Settings() {
  const [instance, setInstance] = useState<Instance>(nullInstance());

  useEffect(() => {
    const fetchData = async () => {
      const receivedStacks = await AWSService.retrieveStack();
      if (receivedStacks) {
        setInstance(receivedStacks);
      }
    };

    fetchData();
  }, []);

  return (
    <section id="admin-settings">
      <h1>Settings</h1>
      <p>
        This section displays the CloudFormation settings for the stack that backs this Nucleus
        instance.
      </p>
      <SettingsTable settings={instance.settings} />
    </section>
  );
}
