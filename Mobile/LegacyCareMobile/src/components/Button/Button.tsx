import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import Colors from "../../theme/colors";


type Props = {

  title: string;

  onPress: () => void;

  disabled?: boolean;

  loading?: boolean;

  variant?: "primary" | "secondary" | "outline";

  style?: ViewStyle;

};



export default function Button({

  title,

  onPress,

  disabled = false,

  loading = false,

  variant = "primary",

  style,

}: Props) {



  const buttonStyle =
    variant === "secondary"
      ? styles.secondaryButton
      : variant === "outline"
      ? styles.outlineButton
      : styles.primaryButton;



  const textStyle =
    variant === "secondary"
      ? styles.secondaryText
      : variant === "outline"
      ? styles.outlineText
      : styles.primaryText;



  return (

    <TouchableOpacity

      style={[
        buttonStyle,
        disabled && styles.disabled,
        style,
      ]}

      activeOpacity={0.8}

      disabled={disabled || loading}

      onPress={onPress}

    >


      {
        loading ?

        (

          <ActivityIndicator

            color={
              variant === "primary"
              ? Colors.primary
              : Colors.gold
            }

          />

        )

        :

        (

          <Text style={textStyle}>

            {title}

          </Text>

        )

      }



    </TouchableOpacity>

  );

}





const styles = StyleSheet.create({


primaryButton:{

 backgroundColor:Colors.gold,

 paddingVertical:16,

 borderRadius:15,

 alignItems:"center",

 marginTop:20,

},



secondaryButton:{

 backgroundColor:Colors.secondary,

 paddingVertical:16,

 borderRadius:15,

 alignItems:"center",

 marginTop:20,

 borderWidth:1,

 borderColor:Colors.gold,

},




outlineButton:{

 backgroundColor:"transparent",

 paddingVertical:16,

 borderRadius:15,

 alignItems:"center",

 marginTop:20,

 borderWidth:1,

 borderColor:Colors.gold,

},




disabled:{

 opacity:0.6,

},




primaryText:{

 fontSize:18,

 fontWeight:"700",

 color:Colors.primary,

 letterSpacing:1,

},



secondaryText:{

 fontSize:18,

 fontWeight:"700",

 color:Colors.gold,

 letterSpacing:1,

},




outlineText:{

 fontSize:18,

 fontWeight:"600",

 color:Colors.gold,

 letterSpacing:1,

},



});