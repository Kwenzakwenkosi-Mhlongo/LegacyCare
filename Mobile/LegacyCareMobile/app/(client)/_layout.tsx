import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import Colors from "../../src/theme/colors";



export default function ClientLayout(){


return(

<Tabs

screenOptions={{

headerShown:false,


tabBarStyle:{

backgroundColor:Colors.primary,

borderTopColor:Colors.border,

height:60,

},


tabBarActiveTintColor:Colors.gold,

tabBarInactiveTintColor:Colors.textMuted,


}}

>



<Tabs.Screen

name="index"

options={{

title:"Home",

tabBarIcon:({color,size})=>(

<Ionicons

name="home-outline"

color={color}

size={size}

/>

)

}}

/>




<Tabs.Screen

name="policy"

options={{

title:"Policy",

tabBarIcon:({color,size})=>(

<Ionicons

name="document-text-outline"

color={color}

size={size}

/>

)

}}

/>





<Tabs.Screen

name="payments"

options={{

title:"Payments",

tabBarIcon:({color,size})=>(

<Ionicons

name="card-outline"

color={color}

size={size}

/>

)

}}

/>





<Tabs.Screen

name="schedule"

options={{

title:"Schedule",

tabBarIcon:({color,size})=>(

<Ionicons

name="calendar-outline"

color={color}

size={size}

/>

)

}}

/>





<Tabs.Screen

name="profile"

options={{

title:"Profile",

tabBarIcon:({color,size})=>(

<Ionicons

name="person-outline"

color={color}

size={size}

/>

)

}}

/>



</Tabs>


);


}