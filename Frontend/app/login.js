import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../provate";
export default function Login() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async () => {

    try{
      const response = await axios.post(
        `${api}/user/login`,
        {
          email: email,
          password: password
        }
      );

      const token = response.data.token;

      // save token
      //await AsyncStorage.setItem("token", token);

      Alert.alert("Success","Login Successful");

      // go to home page
      router.replace({
        pathname : "/home",
        params : {email : email}
      });

    }
    catch(error){

      console.log(error);
      Alert.alert(error.data);
    }

  };

  return(

    <View style={styles.container}>

      <Text style={styles.title}>Login</Text>

      <Text>Email</Text>
      <TextInput
        placeholder="Enter your email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <Text>Password</Text>
      <TextInput
        placeholder="Enter password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
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

  container:{
    flex:1,
    justifyContent:"center",
    padding:20
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    marginBottom:30,
    textAlign:"center"
  },

  input:{
    borderWidth:1,
    borderColor:"#ccc",
    padding:12,
    marginBottom:15,
    borderRadius:8
  },

  button:{
    backgroundColor:"#2E86DE",
    padding:15,
    borderRadius:8
  },

  buttonText:{
    color:"white",
    textAlign:"center",
    fontWeight:"bold"
  },

  link:{
    marginTop:15,
    textAlign:"center",
    color:"blue"
  }

});