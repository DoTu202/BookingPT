import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {TickCircle} from 'iconsax-react-native';
import {RowComponent, TextComponent} from '../../../components';
import appColors from '../../../constants/appColors';
import {fontFamilies} from '../../../constants/fontFamilies';
import {radius, spacing} from '../../../constants/theme';

const ROLES = [
  {value: 'client', title: 'Học viên', description: 'Tìm và đặt lịch với huấn luyện viên'},
  {value: 'pt', title: 'Huấn luyện viên', description: 'Nhận học viên và quản lý lịch dạy'},
];

// Two cards to pick the account type on sign-up.
const RoleSelector = ({value, onChange}) => (
  <View>
    <TextComponent text="Bạn là" size={13} font={fontFamilies.medium} styles={styles.label} />
    <View style={styles.roles}>
      {ROLES.map(role => {
        const selected = value === role.value;
        return (
          <TouchableOpacity
            key={role.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(role.value)}
            accessibilityRole="radio"
            accessibilityState={{selected}}>
            <RowComponent justify="space-between">
              <TextComponent
                text={role.title}
                font={fontFamilies.semiBold}
                color={selected ? appColors.primaryDark : appColors.text}
              />
              {selected ? <TickCircle size={18} color={appColors.primary} variant="Bold" /> : null}
            </RowComponent>
            <TextComponent
              text={role.description}
              size={12}
              color={appColors.textMuted}
              styles={styles.description}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default RoleSelector;

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  roles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: appColors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  description: {
    marginTop: 4,
    lineHeight: 17,
  },
});
