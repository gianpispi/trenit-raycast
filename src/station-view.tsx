import { ActionPanel, List, Action, Icon, Toast, showToast, Detail, Color } from "@raycast/api";
import { useState } from "react";
import { useFetch } from "@raycast/utils";
import { Station } from "./api/stations-service";
import { parseTrains } from "./api/rfi-api";
import { mapTrains, Train, getUrl } from "./api/trains-service";

function DrinkDropdown(props: { onSelectionChange: (newValue: string) => void }) {
  return (
    <List.Dropdown
      filtering={false}
      tooltip="Select Direction"
      storeValue={true}
      onChange={props.onSelectionChange}
    >
      <List.Dropdown.Item key="arrivals" title="Arrivals" value="true" />
      <List.Dropdown.Item key="departures" title="Departures" value="false" />
    </List.Dropdown>
  );
}

function getAccessory(train: Train) {
  if (train.isBlinking) {
    return { tag: `${train.delay}`, icon: { source: Icon.Dot, tintColor: Color.Blue }, tooltip: "Departing now" };
  } else if (train.isDelayed) {
    return { tag: { value: `${train.delay}`, color: Color.Red }, tooltip: `Train delayed by ${train.delay} minutes` };
  } else {
    return {};
  }
}

export function StationView(props: {
  station: Station;
}) {
  const [direction, setDirection] = useState("false");

  const onDrinkTypeChange = (newValue: string) => {
    setDirection(newValue);
  };

  const { isLoading: isLoading, data: trains, revalidate } = useFetch(getUrl(props.station.id, direction), {
    parseResponse(response) {
      return response.text().then(parseTrains);
    },
    mapResult(result) {
      return {data: mapTrains(result)}
    },
    onError(error) {
      // setIsLoading(false);
      (async () => {
        await showToast({
          style: Toast.Style.Failure,
          title: `Could not load trains for ${props.station.name}`,
          message: error.toString(),
        });
      })()
    }
  });

  if (isLoading) {
    return (
      <Detail isLoading={isLoading} markdown={`## Loading ${props.station.name}...`} />

      // <List.Item
      //   title={`Translating to ${props.station.name}...`}
      //   accessories={[
      //     {
      //       text: `${props.station.id}`
      //     },
      //   ]}
      // />
    );
  }

  console.log(trains);

  return (
    // <Detail markdown={`## Stazione di ${props.station.name}`} />

    <List
      navigationTitle={`${props.station.name} station`}
      searchBarAccessory={<DrinkDropdown onSelectionChange={onDrinkTypeChange} />}
      isLoading={isLoading}
      isShowingDetail={!(!trains || trains.length === 0)}
    >
      {!trains || trains.length === 0 ? (
        <List.EmptyView icon={{ source: "https://http.cat/100" }} title="Type something to get started" actions={
          <ActionPanel>
            <Action autoFocus={false} title="Refresh" onAction={revalidate} shortcut={{ modifiers: ["opt"], key: "l" }} />
          </ActionPanel>
        } />
      ) : (
        trains.map((train) => (
          console.log(train.isReplacedByBus),

          <List.Item
            key={train.number}
            title={train.time}
            subtitle={`${train.destination} - ${train.number}`}
            keywords={[train.number, train.destination, train.time]}
            accessories={[
              getAccessory(train)
            ]}
            icon={train.icon ? `${train.icon}.svg` : Icon.Train}
            detail={
              <List.Item.Detail 
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.TagList title={`${train.destination} - ${train.number}`}>
                      {train.isDelayed && <List.Item.Detail.Metadata.TagList.Item text={train.delay} color={Color.Red} />}
                      {train.isBlinking && <List.Item.Detail.Metadata.TagList.Item text="Departing now" color={Color.Blue} />}
                    </List.Item.Detail.Metadata.TagList>

                    <List.Item.Detail.Metadata.Label title="Info" />
                    <List.Item.Detail.Metadata.Label title="Original time" text={train.time} />
                    <List.Item.Detail.Metadata.Label title="Platform" text={train.platform} />
                    <List.Item.Detail.Metadata.Label title="Train" text={`${train.carrier} ${train.number}`} />
                    {train.isReplacedByBus && <List.Item.Detail.Metadata.Label title="This train is replaced by a bus" />}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action autoFocus={false} title="Refresh" onAction={revalidate} shortcut={{ modifiers: ["opt"], key: "l" }} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}