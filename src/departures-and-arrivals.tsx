import { ActionPanel, List, Action, Icon } from "@raycast/api";
import { getStations } from "./api/stations-service";
import { StationView } from "./station-view";

const stations = getStations();

export default function Command() {
  return (
    <List
      searchBarPlaceholder="Search for a train station"
      navigationTitle="Select station"
    >
      {stations.map((station) => (
        <List.Item
          key={station.id}
          title={station.name}
          actions={
            <ActionPanel>
              <Action.Push title="Show trains" target={<StationView station={station} />} icon={Icon.Train} />
              <Action autoFocus={true} title="Favourite station" shortcut={{ modifiers: ["opt"], key: "a" }} icon={Icon.Star} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

