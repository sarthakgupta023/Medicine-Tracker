import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:"center",
    padding:20
  },

  title:{
    fontSize:24,
    fontWeight:"bold",
    marginBottom:20
  },

  input:{
    borderWidth:1,
    padding:10,
    marginBottom:15
  },

  button:{
    backgroundColor:"#2E86DE",
    padding:15,
    alignItems:"center"
  },

  buttonText:{
    color:"white",
    fontWeight:"bold"
  }
});

export default styles;