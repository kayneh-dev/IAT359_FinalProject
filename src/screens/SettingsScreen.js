import { Button, StyleSheet, Text, View } from "react-native";
import { firebase_auth } from "../firebaseConfig";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Button
        title="Sign Out"
        color="#CC0633"
        onPress={() => firebase_auth.signOut()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
