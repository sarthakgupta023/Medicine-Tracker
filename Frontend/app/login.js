import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../private";

export default function Login() {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {

    // ✅ basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${api}/user/login`, {
        email:    email.trim(),
        password: password.trim(),
      });

      const token  = response.data.token;
      const userId = response.data.userId;

      // ✅ save token, userId, email to AsyncStorage
      await AsyncStorage.setItem("token",     token);
      await AsyncStorage.setItem("userId",    userId);
      await AsyncStorage.setItem("userEmail", email.trim());

      Alert.alert("Success", "Login Successful");

      // ✅ go to home — no need to pass email as param
      // home reads it from AsyncStorage now
      router.replace("/home");

    } catch (error) {
      console.log("Login error:", error);

      // ✅ fixed error handling
      const msg = error.response?.data?.message
               || error.response?.data
               || "Something went wrong";
      Alert.alert("Error", msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Login</Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Enter your email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Enter password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Login</Text>
        }
      </TouchableOpacity>

      {/* Signup Redirect */}
      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={styles.link}>
          Don't have an account? Signup
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#1a1a2e",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 15,
    color: "#1a1a2e",
  },

  button: {
    backgroundColor: "#2E86DE",
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
  },

  buttonDisabled: {
    backgroundColor: "#a0c4f1",
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#2E86DE",
    fontWeight: "500",
  },

});