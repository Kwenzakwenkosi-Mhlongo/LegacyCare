import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "../src/theme/colors";
import Typography from "../src/theme/typography";


export default function WelcomeScreen() {

  const router = useRouter();


  return (

    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />


      <View style={styles.content}>


        <View style={styles.logoContainer}>

          <Image
            source={require("../assets/logo/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />

        </View>



        <Text style={styles.welcomeText}>
          Welcome to
        </Text>


        <Text style={styles.appName}>
          LegacyCare
        </Text>



        <Text style={styles.description}>

          Your trusted partner in funeral planning
          and management. We honor lives and
          support families during difficult times.

        </Text>




        <View style={styles.featuresContainer}>


          <Feature text="Manage policies easily" />

          <Feature text="Track payments securely" />

          <Feature text="24/7 support available" />


        </View>




        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.8}
          onPress={() => router.push("/login")}
        >

          <Text style={styles.loginButtonText}>
            LOGIN
          </Text>

        </TouchableOpacity>




        <Text style={styles.infoText}>

          Don't have an account?
          Contact your LegacyCare administrator

        </Text>


      </View>



      <Text style={styles.footer}>
        © 2026 LegacyCare. All rights reserved.
      </Text>


    </LinearGradient>

  );
}





function Feature({text}:{text:string}) {

  return (

    <View style={styles.featureItem}>

      <View style={styles.featureDot}/>

      <Text style={styles.featureText}>
        {text}
      </Text>

    </View>

  );

}





const styles = StyleSheet.create({

container:{
  flex:1,
},


content:{
  flex:1,
  justifyContent:"center",
  paddingHorizontal:30,
},


logoContainer:{
  alignItems:"center",
  marginBottom:30,
},


logo:{
  width:120,
  height:120,
},


welcomeText:{
  textAlign:"center",
  fontSize:18,
  color:Colors.white,
},


appName:{
  textAlign:"center",
  color:Colors.gold,
  fontSize: Typography.heading.fontSize,
  fontWeight:"700",
  letterSpacing:3,
  marginTop:5,
  marginBottom:20,
},


description:{
  textAlign:"center",
  color:Colors.white,
  fontSize:Typography.body.fontSize,
  lineHeight:24,
  marginBottom:30,
},


featuresContainer:{
  marginBottom:40,
},


featureItem:{
  flexDirection:"row",
  alignItems:"center",
  marginBottom:12,
},


featureDot:{
  width:8,
  height:8,
  borderRadius:4,
  backgroundColor:Colors.gold,
  marginRight:12,
},


featureText:{
  color:Colors.white,
  fontSize:Typography.body.fontSize,
},



loginButton:{
  backgroundColor:Colors.gold,
  paddingVertical:18,
  borderRadius:15,
  alignItems:"center",
},


loginButtonText:{
  color:Colors.primary,
  fontSize:18,
  fontWeight:"700",
  letterSpacing:2,
},


infoText:{
  marginTop:20,
  textAlign:"center",
  color:Colors.white,
  fontSize:Typography.small.fontSize,
},


footer:{
  position:"absolute",
  bottom:30,
  width:"100%",
  textAlign:"center",
  color:Colors.white,
  fontSize:12,
},


});