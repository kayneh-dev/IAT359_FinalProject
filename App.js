import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebase_auth } from "./src/firebaseConfig";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes } from "./src/theme";
import MainTabs from "./src/MainTabs";
import SignInScreen from "./src/screens/SignInScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [themeKey, setThemeKey] = useState("red");
  const color = themes[themeKey];

  useEffect(() => {
    AsyncStorage.getItem("themeKey").then((saved) => {if (saved && themes[saved]) setThemeKey(saved);})
      .catch((e) => console.log("Failed to load theme", e));
  }, []);

  function changeTheme(key) {
    setThemeKey(key);
    AsyncStorage.setItem("themeKey", key).catch((e) => console.log("Failed to save theme", e)
    );
  }

  useEffect(() => {
    onAuthStateChanged(firebase_auth, (user) => {console.log("user", user);
    setUser(user);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        {user ? (
          <Stack.Screen
            name="Main"
            options={{ headerShown: false }}
          >
            {() => (<MainTabs
                themeKey={themeKey}
                color={color}
                setThemeKey={changeTheme}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="SignIn"
            options={{ headerShown: false }}
          >
            {() => <SignInScreen color={color} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
