import { faBars, faFileDownload, faFilter, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import moment from "moment";
import { basename } from "path";
import React, { useEffect, useState } from "react";
import { Button, Navbar } from "react-bootstrap";
import config from "../config";
import AWSService from "../services/aws-service";
import { DemoEvent, DemoEventType } from "../types/demo-event";
import "./Consumer.css";
import studentImg from "./student.png";

const Consumer: React.FC = () => {
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>([]);
  const [videoTitle, setVideoTitle] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const receivedEvents = await AWSService.retrieveDemoEvents();
    if (receivedEvents) {
      setDemoEvents(receivedEvents);
    }
  };

  const downloadFile = async (event: any) => {
    await AWSService.downloadFile(event.target.dataset.bucket, event.target.dataset.key);
  };

  const youtubeTitle = async (videoURL: string) => {
    const videoId = new URLSearchParams(videoURL).get("v");
    if (videoId) {
      const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          id: new URLSearchParams(videoURL).get("v"),
          key: config.youtubeApiKey,
          part: "snippet",
        },
      });
      setVideoTitle(response.data.items[0].snippet.title);
    }
  };

  const renderDemoEvents = () =>
    demoEvents.map((demoEvent) => (
      <section key={demoEvent.id}>
        {demoEvent.type === DemoEventType.Video && renderVideo(demoEvent)}
        {demoEvent.type === DemoEventType.DirectFile && renderDirectUpload(demoEvent)}
        {demoEvent.type === DemoEventType.OneRosterEnrollments && renderEnrollments(demoEvent)}
        {demoEvent.type === DemoEventType.OneRosterResults && renderResults(demoEvent)}
      </section>
    ));

  const renderVideo = (demoEvent: DemoEvent) => {
    youtubeTitle(demoEvent.resource);

    return (
      <div>
        <div className="logo logo-go float-left">GO</div>
        <h2>Some Content Product</h2>
        <p className="date">{moment(new Date(demoEvent.creationDate)).fromNow()}</p>
        <p className="mt-3">
          {demoEvent.user}{" "}
          <span
            className={
              demoEvent.additionalInfo.action === "paused" ? "text-danger" : "text-success"
            }
          >
            {demoEvent.additionalInfo.action}
          </span>{" "}
          the video <a href={demoEvent.resource}>{videoTitle}</a>{" "}
          {moment(new Date(demoEvent.creationDate)).fromNow()}
        </p>
      </div>
    );
  };

  const renderDirectUpload = (demoEvent: DemoEvent) => (
    <div>
      <div className="logo logo-s float-left">S</div>
      <h2>Your School LMS</h2>
      <p className="date">{moment(new Date(demoEvent.creationDate)).fromNow()}</p>
      <p className="mt-3">{demoEvent.user} submitted a document to "Bird Project"</p>
      <div>
        <FontAwesomeIcon icon={faFileDownload} size="3x" className="float-left mr-2" />
        <p className="pt-2 mb-0 small">
          <strong>{demoEvent.user}</strong>
        </p>
        <p className="small">
          <Button
            className="p-0"
            variant="link"
            size="sm"
            onClick={downloadFile}
            data-bucket={demoEvent.additionalInfo.bucket}
            data-key={demoEvent.resource}
          >
            {basename(demoEvent.resource)}
          </Button>
        </p>
      </div>
    </div>
  );

  const renderEnrollments = (demoEvent: DemoEvent) => (
    <div>
      <div className="logo logo-sis float-left">SIS</div>
      <h2>Your District SIS</h2>
      <p className="date">{moment(new Date(demoEvent.creationDate)).fromNow()}</p>
      <div className="sis-info">
        <img src={studentImg} alt="Student" className="sis-picture" />
        <p className="m-0 small">
          <strong>{demoEvent.user}</strong>
        </p>
        <p className="m-0 small">8th Grade</p>
        <p className="m-0 small">
          <em>Red Team</em>
        </p>
      </div>
      <p className="mt-3 ml-4">{demoEvent.user} just enrolled into school</p>
    </div>
  );

  const renderResults = (demoEvent: DemoEvent) => (
    <div>
      <div className="logo logo-sc float-left">SC</div>
      <h2>Science Content System</h2>
      <p className="date">{moment(new Date(demoEvent.creationDate)).fromNow()}</p>
      <p className="mt-3">
        {demoEvent.user} scored <strong>{demoEvent.additionalInfo.score}%</strong>
      </p>
    </div>
  );

  return (
    <div className="Consumer">
      <Navbar variant="light" className="bg-amazon" sticky="top">
        <Navbar.Brand>
          <FontAwesomeIcon icon={faFilter} />
        </Navbar.Brand>
        <Navbar.Collapse />
        <span onClick={fetchData}>
          <FontAwesomeIcon icon={faRedo} size="lg" className="mr-3" />
        </span>
        <FontAwesomeIcon icon={faBars} size="lg" />
      </Navbar>
      {renderDemoEvents()}
    </div>
  );
};

export default Consumer;
