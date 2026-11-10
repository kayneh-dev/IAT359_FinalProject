import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, firebase_auth } from "../firebaseConfig";

// JavaScript Date uses 0 for Sunday and 1 for Monday.
const WEEKDAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

function dayLabels(days) {
  if (!Array.isArray(days)) return "No days selected";
  return WEEKDAYS.filter((day) => days.includes(day.id))
    .map((day) => day.label)
    .join(", ");
}

export default function ScheduleScreen({ color = "#B8243A" }) {
  const scrollRef = useRef(null);
  const uid = firebase_auth.currentUser?.uid;

  // Form state
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [editingId, setEditingId] = useState(null);

  // Firestore state
  const [commutes, setCommutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // Retrieve the signed-in user's documents.
  const loadCommutes = useCallback(async () => {
    if (!uid) {
      setError("Please sign in to view your commutes.");
      setCommutes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(collection(db, "users", uid, "commutes"));
      const list = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      setCommutes(list);
    } catch (err) {
      console.log("Load commutes failed:", err);
      setError("Could not load commutes: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Refresh whenever the user returns to the Schedule tab.
  useFocusEffect(
    useCallback(() => {
      loadCommutes();
    }, [loadCommutes]),
  );

  function clearForm() {
    setName("");
    setOrigin("");
    setDestination("");
    setTime("");
    setDays([1, 2, 3, 4, 5]);
    setEditingId(null);
  }

  function toggleDay(id) {
    setDays((current) =>
      current.includes(id)
        ? current.filter((day) => day !== id)
        : [...current, id],
    );
  }

  // Save a new document, or update the selected document.
  async function saveCommute() {
    if (saving || deletingId !== null) return;
    if (!uid) {
      Alert.alert("Sign in required", "Please sign in first.");
      return;
    }

    if (!name.trim() || !origin.trim() || !destination.trim()) {
      Alert.alert(
        "Missing information",
        "Enter a name, origin, and destination.",
      );
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      Alert.alert("Invalid time", "Use 24-hour time, such as 08:30 or 17:15.");
      return;
    }
    if (days.length === 0) {
      Alert.alert("Select days", "Choose at least one weekday.");
      return;
    }

    const commuteData = {
      name: name.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      time: time.trim(),
      days: [...days],
    };

    setSaving(true);
    try {
      if (editingId === null) {
        await addDoc(collection(db, "users", uid, "commutes"), commuteData);
      } else {
        await updateDoc(
          doc(db, "users", uid, "commutes", editingId),
          commuteData,
        );
      }
      clearForm();
      await loadCommutes();
    } catch (err) {
      console.log("Save commute failed:", err);
      Alert.alert("Save failed", err.message);
    } finally {
      setSaving(false);
    }
  }

  function editCommute(commute) {
    setName(commute.name || "");
    setOrigin(commute.origin || "");
    setDestination(commute.destination || "");
    setTime(commute.time || "");
    setDays(Array.isArray(commute.days) ? [...commute.days] : [1, 2, 3, 4, 5]);
    setEditingId(commute.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function confirmDelete(commute) {
    Alert.alert("Delete commute", `Delete "${commute.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeCommute(commute.id),
      },
    ]);
  }

  async function removeCommute(id) {
    if (!uid || deletingId !== null || saving) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "users", uid, "commutes", id));
      if (editingId === id) clearForm();
      await loadCommutes();
    } catch (err) {
      console.log("Delete commute failed:", err);
      Alert.alert("Delete failed", err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color }]}>Schedule</Text>
      <Text style={styles.subtitle}>
        Save your regular trips for easy access.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {editingId === null ? "Add a commute" : "Edit commute"}
        </Text>

        <Text style={styles.label}>Commute name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. School"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>From</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Home"
          value={origin}
          onChangeText={setOrigin}
        />

        <Text style={styles.label}>To</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. SFU Burnaby"
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>Departure time (24-hour)</Text>
        <TextInput
          style={styles.input}
          placeholder="08:30"
          value={time}
          onChangeText={setTime}
          maxLength={5}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Repeat on</Text>
        <View style={styles.daysRow}>
          {WEEKDAYS.map((day) => {
            const selected = days.includes(day.id);
            return (
              <Pressable
                key={day.id}
                onPress={() => toggleDay(day.id)}
                style={[
                  styles.dayButton,
                  selected && { backgroundColor: color, borderColor: color },
                ]}
              >
                <Text
                  style={[styles.dayText, selected && styles.selectedDayText]}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: color }]}
          onPress={saveCommute}
          disabled={saving || deletingId !== null || loading}
        >
          <Text style={styles.primaryButtonText}>
            {saving
              ? "Saving..."
              : editingId === null
                ? "Add commute"
                : "Save changes"}
          </Text>
        </Pressable>

        {editingId !== null && (
          <Pressable style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.cancelText}>Cancel editing</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.headingRow}>
        <Text style={styles.sectionTitle}>
          Saved commutes ({commutes.length})
        </Text>
        <Pressable onPress={loadCommutes} disabled={loading}>
          <Text style={[styles.actionText, { color }]}>Refresh</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator size="large" color={color} />}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && commutes.length === 0 && (
        <Text style={styles.emptyText}>No commutes yet. Add one above.</Text>
      )}

      {!loading &&
        commutes.map((commute) => (
          <View key={commute.id} style={styles.card}>
            <Text style={styles.commuteName}>{commute.name}</Text>
            <Text style={styles.routeText}>
              {commute.origin} → {commute.destination}
            </Text>
            <Text style={styles.details}>Departure: {commute.time}</Text>
            <Text style={styles.details}>Days: {dayLabels(commute.days)}</Text>
            <View style={styles.actionsRow}>
              <Pressable onPress={() => editCommute(commute)} disabled={saving}>
                <Text style={[styles.actionText, { color }]}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(commute)}
                disabled={saving || deletingId !== null}
              >
                <Text style={styles.deleteText}>
                  {deletingId === commute.id ? "Deleting..." : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },
  content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold" },
  subtitle: { marginTop: 5, marginBottom: 22, color: "grey" },
  card: {
    backgroundColor: "white",
    borderColor: "#DDDDDD",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 18 },
  dayButton: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  dayText: { color: "#444444", fontWeight: "600" },
  selectedDayText: { color: "white" },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  cancelButton: { alignItems: "center", paddingTop: 14 },
  cancelText: { color: "#555555", fontWeight: "600" },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 5,
  },
  commuteName: { fontSize: 18, fontWeight: "bold" },
  routeText: { marginTop: 6, marginBottom: 8, color: "#333333" },
  details: { marginTop: 3, color: "#666666" },
  actionsRow: { flexDirection: "row", gap: 25, marginTop: 15 },
  actionText: { fontWeight: "bold" },
  deleteText: { color: "#C62828", fontWeight: "bold" },
  errorText: { color: "#B00020", marginVertical: 10 },
  emptyText: { color: "grey", textAlign: "center", paddingVertical: 24 },
});
