import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "../src/theme/colors";
import Typography from "../src/theme/typography";


export default function SplashScreen() {

  const router = useRouter();


  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 2500);


    return () => clearTimeout(timer);

  }, []);


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



        <Text style={styles.appName}>
          LegacyCare
        </Text>


        <Text style={styles.tagline}>
          Honoring Lives, Supporting Families
        </Text>



        <ActivityIndicator
          size="small"
          color={Colors.gold}
          style={styles.loader}
        />


      </View>



      <Text style={styles.footer}>
        © 2026 LegacyCare
      </Text>


    </LinearGradient>

  );
}



const styles = StyleSheet.create({

  container:{
    flex:1,
  },


  content:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },


  logoContainer:{
    marginBottom:30,
  },


  logo:{
    width:150,
    height:150,
  },


  appName:{
    fontSize:Typography.heading.fontSize,
    fontWeight:"700",
    color:Colors.gold,
    letterSpacing:4,
    textTransform:"uppercase",
  },


  tagline:{
    marginTop:10,
    color:Colors.white,
    fontSize:Typography.small.fontSize,
  },


  loader:{
    marginTop:50,
  },


  footer:{
    position:"absolute",
    bottom:40,
    alignSelf:"center",
    color:Colors.white,
    fontSize:12,
  },


});