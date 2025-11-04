"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";

export default function PusherListener() {
  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher("609743b48b8ed073d67f", {
      cluster: "us2",
    });

    const channel = pusher.subscribe("my-channel");

    channel.bind("my-event", function (data: any) {
      alert(JSON.stringify(data));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return null;
}
