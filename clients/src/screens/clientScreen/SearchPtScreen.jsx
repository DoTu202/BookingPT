import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'

const SearchPtScreen = ({navigation, route}) => {
    const {isFilter} = route.params; 

    console.log(isFilter)
  return (
    <View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
              }}>
              <ArrowLeft size={22} color={appColors.white} />
            </TouchableOpacity>
    </View>
  )
}

export default SearchPtScreen

const styles = StyleSheet.create({})