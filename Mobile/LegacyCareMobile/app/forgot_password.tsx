import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


import Button from "../src/components/Button/Button";
import Input from "../src/components/Input/Input";
import Colors from "../src/theme/colors";
import Typography from "../src/theme/typography";



export default function ForgotPasswordScreen(){


  const router = useRouter();


  const [email,setEmail] = useState("");

  const [isLoading,setIsLoading] = useState(false);





  const handleResetPassword = async()=>{


    if(!email){


      Alert.alert(
        "Error",
        "Please enter your email address"
      );


      return;

    }



    if(!email.includes("@")){


      Alert.alert(
        "Error",
        "Please enter a valid email address"
      );


      return;

    }




    setIsLoading(true);



    try{


      // TODO: Connect to ASP.NET Web API


      await new Promise(resolve =>
        setTimeout(resolve,1000)
      );



      Alert.alert(

        "Reset Link Sent",

        "A password reset link has been sent to your email.",

        [
          {
            text:"OK",
            onPress:()=>router.back()
          }
        ]

      );



    }

    catch(error){


      Alert.alert(

        "Error",

        "Unable to send reset link. Please try again."

      );


    }



    finally{

      setIsLoading(false);

    }



  };






  return(



    <LinearGradient

      colors={[
        Colors.primary,
        Colors.secondary
      ]}

      style={styles.container}

    >



    <StatusBar

      barStyle="light-content"

      backgroundColor={Colors.primary}

    />





    <KeyboardAvoidingView

      style={styles.container}

      behavior={
        Platform.OS === "ios"
        ?"padding"
        :"height"
      }

    >




    <ScrollView

      contentContainerStyle={styles.content}

      showsVerticalScrollIndicator={false}

    >





    <TouchableOpacity

      onPress={()=>router.back()}

    >

      <Text style={styles.backButton}>

        ← Back

      </Text>


    </TouchableOpacity>






    <View style={styles.header}>


      <Text style={styles.title}>

        Reset Password

      </Text>



      <Text style={styles.subtitle}>

        Enter your email address and we will
        send you a link to reset your password.

      </Text>


    </View>







    <View style={styles.form}>



      <Input

        placeholder="Email Address"

        value={email}

        onChangeText={setEmail}

        keyboardType="email-address"

      />






      <Button

        title={
          isLoading
          ?"SENDING..."
          :"SEND RESET LINK"
        }

        onPress={handleResetPassword}

      />






      <View style={styles.infoBox}>


        <View style={styles.infoHeader}>


          <Ionicons

            name="mail-outline"

            size={20}

            color={Colors.gold}

          />



          <Text style={styles.infoTitle}>

            What happens next?

          </Text>


        </View>





        <Text style={styles.infoText}>

          1. Receive a reset link by email{"\n"}

          2. Open the link{"\n"}

          3. Create a new password{"\n"}

          4. Login again

        </Text>



      </View>






      <TouchableOpacity

        style={styles.loginLink}

        onPress={()=>router.back()}

      >


        <Text style={styles.loginText}>

          Remember your password?

          <Text style={styles.highlight}>

            {" "}Login

          </Text>


        </Text>



      </TouchableOpacity>





    </View>





    <Text style={styles.footer}>

      © 2026 LegacyCare

    </Text>






    </ScrollView>




    </KeyboardAvoidingView>





    </LinearGradient>


  );

}








const styles = StyleSheet.create({



container:{
 flex:1,
},



content:{
 flexGrow:1,
 paddingHorizontal:24,
 paddingTop:60,
},




backButton:{
 color:Colors.gold,
 fontSize:16,
},



header:{
 marginTop:30,
 marginBottom:30,
},



title:{
 color:Colors.white,
 fontSize:Typography.heading.fontSize,
 fontWeight:"700",
},



subtitle:{
 color:Colors.white,
 fontSize:Typography.body.fontSize,
 marginTop:10,
 lineHeight:22,
},




form:{
 flex:1,
},




infoBox:{
 marginTop:25,
 padding:16,
 borderRadius:12,
 backgroundColor:Colors.secondary,
},



infoHeader:{
 flexDirection:"row",
 alignItems:"center",
 marginBottom:10,
},




infoTitle:{
 color:Colors.white,
 fontSize:16,
 fontWeight:"600",
 marginLeft:10,
},




infoText:{
 color:Colors.white,
 fontSize:Typography.small.fontSize,
 lineHeight:22,
},




loginLink:{
 alignItems:"center",
 marginTop:25,
},




loginText:{
 color:Colors.white,
 fontSize:Typography.small.fontSize,
},



highlight:{
 color:Colors.gold,
 fontWeight:"600",
},




footer:{
 textAlign:"center",
 color:Colors.white,
 fontSize:12,
 marginTop:40,
},




});