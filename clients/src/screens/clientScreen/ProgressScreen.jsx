import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import {globalStyles} from '../../styles/globalStyles';
import appColors from '../../constants/appColors';
import {
  RowComponent,
  TextComponent,
  CircleComponent,
  SpaceComponent,
  TagBarComponent,
  CardComponent,
} from '../../components';
import {
  ArrowDown,
  HambergerMenu,
  Notification,
  Weight,
  Ruler,
  Heart,
  ArrowRight2,
  Add,
} from 'iconsax-react-native';
import {fontFamilies} from '../../constants/fontFamilies';

// --- DỮ LIỆU MẪU ---
const progressData = {
  weight: {value: '72.5', unit: 'kg', change: '-1.5kg'},
  bodyFat: {value: '18.2', unit: '%', change: '-0.8%'},
  bmi: {value: '22.1', unit: '', change: '-0.5'},
};

const activityData = [
  {
    id: '1',
    type: 'Strength',
    icon: 'weight',
    title: 'Full Body Workout',
    date: 'June 12, 2025',
    duration: '45 mins',
  },
  {
    id: '2',
    type: 'Cardio',
    icon: 'heart',
    title: 'Morning Run',
    date: 'June 11, 2025',
    duration: '30 mins',
  },
  {
    id: '3',
    type: 'Strength',
    icon: 'weight',
    title: 'Leg Day',
    date: 'June 10, 2025',
    duration: '60 mins',
  },
];
// --- KẾT THÚC DỮ LIỆU MẪU ---


// --- COMPONENT CON CHO CÁC THẺ CHỈ SỐ ---
const StatCard = ({icon, value, unit, name, change}) => (
  <CardComponent styles={styles.statCard}>
    <RowComponent>
      <CircleComponent size={40} color={appColors.lightGray}>
        {icon}
      </CircleComponent>
      <SpaceComponent width={12} />
      <View style={{flex: 1}}>
        <RowComponent>
          <TextComponent
            text={value}
            font={fontFamilies.bold}
            size={18}
            color={appColors.black}
          />
          <TextComponent text={` ${unit}`} size={14} color={appColors.gray} />
        </RowComponent>
        <TextComponent text={name} size={12} color={appColors.gray} />
      </View>
    </RowComponent>
    <TextComponent text={change} size={12} color={appColors.primary} styles={{marginTop: 8}}/>
  </CardComponent>
);

// --- COMPONENT CON CHO CÁC MỤC HOẠT ĐỘNG ---
const ActivityItem = ({item}) => {
    let icon;
    if (item.icon === 'weight') {
        icon = <Weight size="22" color={appColors.primary} />;
    } else if (item.icon === 'heart') {
        icon = <Heart size="22" color={appColors.primary} />;
    }

    return (
        <TouchableOpacity>
            <RowComponent styles={styles.activityItem}>
                <CircleComponent size={50} color={`${appColors.primary}20`}>
                    {icon}
                </CircleComponent>
                <SpaceComponent width={16}/>
                <View style={{flex: 1}}>
                    <TextComponent text={item.title} font={fontFamilies.bold} />
                    <TextComponent text={item.date} size={12} color={appColors.gray}/>
                </View>
                <TextComponent text={item.duration} size={12} color={appColors.gray}/>
                <SpaceComponent width={12}/>
                <ArrowRight2 size={16} color={appColors.gray}/>
            </RowComponent>
        </TouchableOpacity>
    )
}

// --- MÀN HÌNH CHÍNH ---
const ProgressScreen = ({navigation}) => {

  const [hasData, setHasData] = useState(true); 

  return (
    <View style={{flex: 1, backgroundColor: appColors.white}}>
      <StatusBar barStyle={'light-content'} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <RowComponent>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <HambergerMenu color={appColors.white} size={24} />
          </TouchableOpacity>
          <View style={{flex: 1, alignItems: 'center'}}>
            <TextComponent text="My Progress" font={fontFamilies.bold} color={appColors.white} size={18} />
          </View>
          <CircleComponent size={40} onPress={() => {}} color="rgba(255,255,255,0.2)">
            <Add size={24} color={appColors.white} />
          </CircleComponent>
        </RowComponent>
      </View>

      {/* --- NỘI DUNG CHÍNH --- */}
      <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1}}>
        {!hasData ? (
            <View style={styles.emptyContainer}>
                <CircleComponent size={100} color={appColors.lightGray}>
                    <Ruler size={40} color={appColors.gray}/>
                </CircleComponent>
                <SpaceComponent height={20}/>
                <TextComponent text="No Progress Data" font={fontFamilies.bold} size={20}/>
                <TextComponent text="Add your measurements to start tracking" color={appColors.gray} styles={{textAlign: 'center', paddingHorizontal: 20}} />
                <SpaceComponent height={20}/>
                <TouchableOpacity style={styles.addButton}>
                    <TextComponent text='Add Measurement' color={appColors.white} font={fontFamilies.bold}/>
                </TouchableOpacity>
            </View>
        ) : (
            <View>
                {/* Phần các chỉ số tổng quan */}
                <TagBarComponent title="Overall Stats" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                    <StatCard icon={<Weight size="20" color={appColors.primary}/>} {...progressData.weight} name="Weight"/>
                    <SpaceComponent width={16}/>
                    <StatCard icon={<Ruler size="20" color={appColors.primary}/>} {...progressData.bodyFat} name="Body Fat"/>
                    <SpaceComponent width={16}/>
                    <StatCard icon={<Heart size="20" color={appColors.primary}/>} {...progressData.bmi} name="BMI"/>
                </ScrollView>

                {/* Phần hoạt động gần đây */}
                <TagBarComponent title="Recent Activity" />
                <View style={{paddingHorizontal: 20}}>
                    {activityData.map(item => <ActivityItem item={item} key={item.id}/>)}
                </View>
            </View>
        )}
        <SpaceComponent height={20}/>
      </ScrollView>
    </View>
  );
};

export default ProgressScreen;


// --- STYLES ---
const styles = StyleSheet.create({
    header: {
        backgroundColor: appColors.primary,
        height: 120,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
        paddingHorizontal: 20,
        justifyContent: 'center'
    },
    statCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: appColors.white,
        width: 160,
    },
    activityItem: {
        marginBottom: 16,
        alignItems: 'center'
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
        justifyContent: 'center'
    },
    addButton: {
        backgroundColor: appColors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100
    }
})