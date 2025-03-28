import { useState } from "react";
import { Button } from "./ui/button";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CalendarEvents() {
  const [shown, setShown] = useState<boolean>(false);
  const [events, setEvents] = useState([]);
  const getThisWeeksEventsAction = useAction(api.calendar.getThisWeeksEvents);

  const handleClick = async () => {
    const { events: data } = await getThisWeeksEventsAction();
    if (data) {
      setEvents(data);
    }
    setShown(!shown);
  };

  return (
    <div className="flex flex-col gap-3 mt-8">
      <Button
        onClick={handleClick}
      >{`${shown ? "Hide" : "Show"} This Weeks Events`}</Button>
      {shown && (
        <pre className="max-w-lg text-wrap mx-auto overflow-auto border rounded-md p-2">
          {JSON.stringify(events, null, 2)}
        </pre>
      )}
    </div>
  );
}
