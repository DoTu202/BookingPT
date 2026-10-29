import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Crown1} from 'iconsax-react-native';
import {Avatar, Card, ListItem, TextComponent} from '../../../../components';
import appColors from '../../../../constants/appColors';
import {fontFamilies} from '../../../../constants/fontFamilies';
import {spacing} from '../../../../constants/theme';
import {formatCompactCurrency} from '../../../../utils/format';

// Clients ranked by completed sessions in the period.
const TopClientsCard = ({clients}) => (
  <Card title="Học viên nổi bật" subtitle="Theo số buổi hoàn thành trong kỳ">
    {clients.length === 0 ? (
      <TextComponent text="Chưa có buổi tập hoàn thành trong kỳ này." size={13} color={appColors.textMuted} />
    ) : (
      clients.map((client, index) => (
        <ListItem
          key={client._id}
          divider={index > 0}
          leading={
            <View style={styles.leading}>
              <View style={styles.rank}>
                {index === 0 ? (
                  <Crown1 size={16} color={appColors.warning} variant="Bold" />
                ) : (
                  <TextComponent text={String(index + 1)} size={13} font={fontFamilies.bold} color={appColors.textMuted} />
                )}
              </View>
              <Avatar uri={client.photoUrl} name={client.username} size={36} />
            </View>
          }
          title={client.username || 'Tài khoản đã xoá'}
          trailing={
            <View style={styles.alignEnd}>
              <TextComponent text={`${client.sessions} buổi`} size={13} font={fontFamilies.semiBold} />
              <TextComponent text={formatCompactCurrency(client.earnings)} size={11} color={appColors.textMuted} />
            </View>
          }
        />
      ))
    )}
  </Card>
);

export default TopClientsCard;

const styles = StyleSheet.create({
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: {
    width: 20,
    alignItems: 'center',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
});
