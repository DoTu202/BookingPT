import {StyleSheet} from 'react-native';
import appColors from '../constants/appColors';
import {fontFamilies} from '../constants/fontFamilies';


export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  text:{
    fontFamily: fontFamilies.regular,
    color: appColors.text,
    fontSize: 14,
    includeFontPadding: false,
  },
  shadow:{
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.3)': 'rgba(0,0,0,0.5)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,

  },

  button:{
  paddingVertical: 10,
  paddingHorizontal: 16,
  flexDirection: 'row',
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  row:{
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  card: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
  },

})