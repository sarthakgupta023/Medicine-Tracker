import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../provate";
import styles from "../styles/signupStyles";
export default function Signup() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignup = async () =>{
        try {

            const response = await axios.post(
                `${api}/user/signup`,
                {
                  name,
                  email,
                  password
                }
              ); 
            if(response === "true") {
                Alert.alert("User created successfully");
            }
            else {
                Alert.alert("User already exists");
            }
            
            router.replace("/login");

        }
        catch(error){

            Alert.alert("Error","Signup failed");

            console.log(error);

        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Create Account</Text>

            <Text>Name :</Text>
            <TextInput
                placeholder="Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <Text>Email :</Text>
            <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
            />

            <Text>Password :</Text>
            <TextInput
                placeholder="Password"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Signup</Text>
            </TouchableOpacity>

        </View>
    );
}