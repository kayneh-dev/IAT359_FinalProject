import { Button, StyleSheet, Text, View } from "react-native";
import { firebase_auth } from "../firebaseConfig";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Button title="Sign Out" onPress={() => firebase_auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
