import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SectionComponent, ButtonComponent, TextComponent } from '../../../components'

import appColors from '../../../constants/appColors'
import {fontFamilies} from '../../../constants/fontFamilies'
import { Google } from '../../../assets/svg'
import { Facebook } from '../../../assets/svg'

const SocialLogin = () => {
  return (
    <View style={{alignItems: 'center', paddingVertical: 20, width: '100%'}}>
      <TextComponent 
        style={{textAlign: "center", width: '100%'}} 
        text="OR"
        size={4} 
        color={appColors.gray}
        font={fontFamilies.medium}
      />

      <ButtonComponent 
        styles={{
          width: '100%',
          height: 40,
          borderRadius: 28,
          alignItems: 'center',
          position: 'relative',
          marginBottom: 16
        }}
        type="primary"
        onPress={() => {}}
        text="Continue with Google"
        textColor={appColors.black}
        color={appColors.white}
        textStyles={{fontSize: 12}}
        iconFlex="left"
        icon={
          <View style={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            zIndex: 1
          }}>
            <Google />
          </View>
        } 
      />
      
      <ButtonComponent 
        styles={{
          width: '100%',
          height: 40,
          borderRadius: 28,
          alignItems: 'center',
          position: 'relative'
        }}
        type="primary"
        color={appColors.white}
        textColor={appColors.black}
        iconFlex="left"
        onPress={() => {}}
        text="Continue with Facebook"
        textStyles={{fontSize: 12}}
        icon={
          <View style={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            zIndex: 1
          }}>
            <Facebook />
          </View>
        }
      />
    </View>
  )
}

export default SocialLogin

const styles = StyleSheet.create({})