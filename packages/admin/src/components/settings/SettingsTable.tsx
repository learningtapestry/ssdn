import React from "react";
import Table from "react-bootstrap/Table";
import Setting from "../../interfaces/setting";

interface SettingsTableProps {
  settings: Setting[];
}

export default function SettingsTable(props: SettingsTableProps) {
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
