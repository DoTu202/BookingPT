import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { globalStyles } from '../../styles/globalStyles'
import appColors from '../../constants/appColors'
import {TextComponent, InputComponent, ButtonComponent} from '../../components'
import {fontFamilies} from '../../constants/fontFamilies'
import {ArrowLeft} from 'iconsax-react-native'
import { useState } from 'react'

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('')
  return (
    <SafeAreaView style={[globalStyles.container, {backgroundColor: appColors.black, height: '100%'}]}>
      <TouchableOpacity onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ArrowLeft size={22} color={appColors.white} />
      </TouchableOpacity>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30}}>
      
          <TextComponent 
          text="Reset Password"
          styles={{color: appColors.white, fontSize: 24, fontFamily: fontFamilies.bold, padding: 20, alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}
          />
          <TextComponent
            text="Enter your email to reset your password"
            styles={{color: appColors.white, fontSize: 14, fontFamily: fontFamilies.regular, padding: 20, alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}
          />
          <InputComponent
            value={email}
            onChange={setEmail}
            placeholder="Email"
            secureTextEntry
            allowClear
          />
          <ButtonComponent
            text="Reset Password"
            type="primary"
            onPress={() => navigation.navigate('VerifyCodeScreen')}
            styles={{width: '100%', marginTop: 20}}
          />
      
      </View>
    </SafeAreaView>
  )
}

export default ForgotPasswordScreen

const styles = StyleSheet.create({})