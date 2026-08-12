import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

import { AuthProvider } from "../src/context/AuthContext";
import { getUser } from "../src/services/auth";


export default function Layout() {


  useEffect(()=>{

    checkUser();

  },[]);



  const checkUser = async()=>{

    const user = await getUser();


    if(user){

      if(user.role === "Client"){

        router.replace("/(client)");

      }

      else if(user.role === "Staff"){

        router.replace("/(staff)");

      }

    }

  };



  return (

<AuthProvider>

    <>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />

      <Stack
        screenOptions={{
          headerShown:false,
          animation:"slide_from_right",
        }}
      />

    </>

</AuthProvider>

);
}