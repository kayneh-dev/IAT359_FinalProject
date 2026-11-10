import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db, firebase_auth } from "../firebaseConfig";

export default function ScheduleScreen() {
  // State for the form inputs
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");

  // State for saved commutes and editing
  const [commutes, setCommutes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Retrieve commutes when the screen first opens
  useEffect(() => {
    loadCommutes();
  }, []);

  // Read saved commutes from the signed-in user's Firestore collection
  async function loadCommutes() {
    const user = firebase_auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const querySnapshot = await getDocs(
        collection(db, "users", user.uid, "commutes"),
      );

      const list = [];

      querySnapshot.forEach((document) => {
        list.push({
          id: document.id,
          ...document.data(),
        });
      });

      setCommutes(list);
    } catch (error) {
      console.log(error.message);
      Alert.alert("Error", "Could not load commutes: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Clear the form after adding or editing
  function clearForm() {
    setName("");
    setOrigin("");
    setDestination("");
    setTime("");
    setDays("");
    setEditingId(null);
  }

  // Add a new commute or update an existing one
  async function saveCommute() {
    if (saving || loading) return;

    // Make sure all fields have information
    if (
      !name.trim() ||
      !origin.trim() ||
      !destination.trim() ||
      !time.trim() ||
      !days.trim()
    ) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    const user = firebase_auth.currentUser;

    if (!user) {
      Alert.alert("Error", "Please sign in first.");
      return;
    }

    // Store the information as a JavaScript object
    const commuteData = {
      name: name.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      time: time.trim(),
      days: days.trim(),
    };

    setSaving(true);

    try {
      if (editingId === null) {
        // Add a new document to Firestore
        await addDoc(
          collection(db, "users", user.uid, "commutes"),
          commuteData,
        );
      } else {
        // Update the selected document in Firestore
        await updateDoc(
          doc(db, "users", user.uid, "commutes", editingId),
          commuteData,
        );
      }

      // Clear the form and reload the saved commutes
      clearForm();
      await loadCommutes();
    } catch (error) {
      console.log(error.message);
      Alert.alert("Error", "Could not save commute: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Load the selected commute into the form
  function editCommute(commute) {
    setName(commute.name);
    setOrigin(commute.origin);
    setDestination(commute.destination);
    setTime(commute.time);
    setDays(commute.days);
    setEditingId(commute.id);
  }

  // Ask the user to confirm before deleting
  function deleteCommute(id) {
    Alert.alert(
      "Delete Commute",
      "Are you sure you want to delete this commute?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeCommute(id),
        },
      ],
    );
  }

  // Delete the selected document from Firestore
  async function removeCommute(id) {
    if (saving || loading) return;

    const user = firebase_auth.currentUser;

    if (!user) {
      Alert.alert("Error", "Please sign in first.");
      return;
    }

    setSaving(true);

    try {
      await deleteDoc(doc(db, "users", user.uid, "commutes", id));

      // Reset the form if the deleted commute was being edited
      if (editingId === id) {
        clearForm();
      }

      // Refresh the list
      await loadCommutes();
    } catch (error) {
      console.log(error.message);
      Alert.alert("Error", "Could not delete commute: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={commutes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Your Regular Commutes</Text>

          <TextInput
            style={styles.input}
            placeholder="Commute Name (e.g. School)"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="From (e.g. Home)"
            value={origin}
            onChangeText={setOrigin}
          />

          <TextInput
            style={styles.input}
            placeholder="To (e.g. SFU Burnaby)"
            value={destination}
            onChangeText={setDestination}
          />

          <TextInput
            style={styles.input}
            placeholder="Departure Time (e.g. 08:00)"
            value={time}
            onChangeText={setTime}
          />

          <TextInput
            style={styles.input}
            placeholder="Days (e.g. Mon-Fri)"
            value={days}
            onChangeText={setDays}
          />

          <Button
            title={editingId === null ? "Add Commute" : "Save Changes"}
            onPress={saveCommute}
            color="#CC0633"
            disabled={saving || loading}
          />

          {editingId !== null ? (
            <Button title="Cancel Editing" onPress={clearForm} />
          ) : null}

          <Text style={styles.subtitle}>Your Commutes</Text>

          {loading ? <ActivityIndicator size="large" color="#CC0633" /> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.commuteName}>{item.name}</Text>

          <Text>
            {item.origin} to {item.destination}
          </Text>

          <Text>Departure: {item.time}</Text>
          <Text>Days: {item.days}</Text>

          <View style={styles.buttonRow}>
            <Button
              title="Edit"
              color="#CC0633"
              disabled={saving || loading}
              onPress={() => editCommute(item)}
            />

            <Button
              title="Delete"
              color="red"
              disabled={saving || loading}
              onPress={() => deleteCommute(item.id)}
            />
          </View>
        </View>
      )}
      ListEmptyComponent={!loading ? <Text>No commutes added yet.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "white",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  commuteName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});
