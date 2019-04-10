import React, { useEffect, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Instance from "../interfaces/instance";
import AWSService from "../services/aws-service";
import SettingsTable from "./SettingsTable";

export default function Settings() {
  const [instances, setInstances] = useState<Instance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const receivedStacks = await AWSService.availableStacks();
      if (receivedStacks) {
        setInstances(receivedStacks);
      }
    };

    fetchData();
  }, []);

  const renderInstances = () =>
    instances.map((instance) => (
      <Tab key={instance.name} eventKey={instance.name} title={instance.name}>
        <SettingsTable settings={instance.settings} />
      </Tab>
    ));

  return (
    <section id="admin-settings">
      <h1>Settings</h1>
      <p>
        This section displays the CloudFormation settings for every stack related to Nucleus in your
        your account
      </p>
      <Tabs id="stacks-tabs" className="mt-4">
        {renderInstances()}
      </Tabs>
    </section>
  );
}
