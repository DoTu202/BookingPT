import { Dimensions } from 'react-native';

export const appInfo = {
    sizes: {
        WIDTH: Dimensions.get('window').width,
        HEIGHT: Dimensions.get('window').height
    },
    // BASE_URL: 'http://192.168.1.21:3001', //local wifi network

    BASE_URL: 'http://10.83.2.221:3001', //sb wifi network

}