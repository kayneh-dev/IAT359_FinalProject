import { useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ScheduleScreen() {
  // Store the information entered by the user
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");

  // Store the list of commutes
  const [commutes, setCommutes] = useState([]);

  // Keep track of which commute is being edited
  const [editingId, setEditingId] = useState(null);

  // Clear all the input fields
  function clearForm() {
    setName("");
    setOrigin("");
    setDestination("");
    setTime("");
    setDays("");
    setEditingId(null);
  }

  // Add a new commute or save changes to an existing commute
  function saveCommute() {
    // Check that all fields have been filled in
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

    // If editingId is null, add a new commute
    if (editingId === null) {
      const newCommute = {
        id: Date.now().toString(),
        name: name.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        time: time.trim(),
        days: days.trim(),
      };

      setCommutes([...commutes, newCommute]);
    } else {
      // Otherwise, update the selected commute
      const updatedCommutes = commutes.map((commute) => {
        if (commute.id === editingId) {
          return {
            ...commute,
            name: name.trim(),
            origin: origin.trim(),
            destination: destination.trim(),
            time: time.trim(),
            days: days.trim(),
          };
        }

        return commute;
      });

      setCommutes(updatedCommutes);
    }

    // Clear the fields after saving
    clearForm();
  }

  // Load an existing commute into the input fields
  function editCommute(commute) {
    setName(commute.name);
    setOrigin(commute.origin);
    setDestination(commute.destination);
    setTime(commute.time);
    setDays(commute.days);
    setEditingId(commute.id);
  }

  // Delete a selected commute
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
          onPress: () => {
            const updatedCommutes = commutes.filter(
              (commute) => commute.id !== id,
            );

            setCommutes(updatedCommutes);

            // Clear the form if the deleted commute was being edited
            if (editingId === id) {
              clearForm();
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
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
      />

      {editingId !== null ? (
        <Button title="Cancel Editing" onPress={clearForm} />
      ) : null}

      <Text style={styles.subtitle}>Your Commutes</Text>

      <FlatList
        data={commutes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.commuteName}>{item.name}</Text>
            <Text>
              {item.origin} → {item.destination}
            </Text>
            <Text>Departure: {item.time}</Text>
            <Text>Days: {item.days}</Text>

            <View style={styles.buttonRow}>
              <Button
                title="Edit"
                onPress={() => editCommute(item)}
                color="#CC0633"
              />

              <Button
                title="Delete"
                onPress={() => deleteCommute(item.id)}
                color="red"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No commutes added yet.</Text>}
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
