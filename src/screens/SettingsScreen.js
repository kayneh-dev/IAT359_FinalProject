import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { firebase_auth } from "../firebaseConfig";
import { themes } from "../theme";

export default function SettingsScreen() {
  const [themeKey, setThemeKey] = useState("red");
  const color = themes[themeKey];
  const user = firebase_auth.currentUser;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color }]}>Settings</Text>

      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.name}>{user?.displayName || "No name"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
        <Pressable onPress={() => firebase_auth.signOut()}>
          <Text style={[styles.logout, { color }]}>Log out</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.themeRow}>
          <Text style={styles.label}>Theme</Text>
          <View style={styles.buttons}>
            {Object.entries(themes).map(([key, c]) => (
              <Pressable
                key={key}
                onPress={() => setThemeKey(key)}
                style={[
                  styles.themeButton,
                  { backgroundColor: c },
                  themeKey === key && styles.themeButtonSelected,
                ]}
              >
                <Text style={styles.themeButtonText}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "lightgrey",
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "lightgrey",
    marginRight: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    color: "grey",
    marginTop: 2,
  },
  logout: {
    fontWeight: "600",
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 3,
    borderColor: "transparent",
  },
  themeButtonSelected: {
    borderColor: "darkgrey",
  },
  themeButtonText: {
    color: "white",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});