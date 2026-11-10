import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs({ themeKey, color, setThemeKey }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color,
      }}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} color={color} />}
      </Tab.Screen>
      <Tab.Screen name="Map">{() => <MapScreen color={color} />}</Tab.Screen>
      <Tab.Screen name="Schedule">
        {() => <ScheduleScreen color={color} />}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {() => (
          <SettingsScreen
            themeKey={themeKey}
            color={color}
            setThemeKey={setThemeKey}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
