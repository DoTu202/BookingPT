import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import TextComponent from './TextComponent';
import appColors from '../constants/appColors';
import {spacing} from '../constants/theme';

// Rounds the axis maximum up to 1, 2 or 5 x 10^n so gridlines get round labels.
const niceMax = value => {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find(n => n * magnitude >= value);
  return step * magnitude;
};

// Simple vertical bar chart. data = [{key, value}]; tapping a bar selects it
// (tap again to clear). Up to 12 bars get every label, longer series every
// `labelEvery`-th one.
const BarChart = ({
  data,
  height = 150,
  color = appColors.primary,
  selectedIndex = null,
  onSelect,
  labelFor = key => key,
  formatAxis = String,
  labelEvery = 5,
  emptyText = 'Chưa có dữ liệu',
}) => {
  const max = niceMax(Math.max(0, ...data.map(item => item.value)));
  const isEmpty = data.every(item => !item.value);
  const showLabel = index =>
    data.length <= 12 || index === 0 || (index + 1) % labelEvery === 0;
  const hasSelection = selectedIndex !== null;

  return (
    <View>
      <View style={styles.plot}>
        <View style={[styles.axis, {height}]}>
          {isEmpty
            ? null
            : [max, max / 2, 0].map(value => (
                <TextComponent key={value} text={formatAxis(value)} size={10} color={appColors.textMuted} />
              ))}
        </View>
        <View style={[styles.area, {height}]}>
          {[0, 0.5, 1].map(ratio => (
            <View key={ratio} style={[styles.gridline, {top: ratio * height}]} />
          ))}
          {isEmpty ? (
            <View style={styles.empty}>
              <TextComponent text={emptyText} size={13} color={appColors.textMuted} />
            </View>
          ) : null}
          <View style={styles.bars}>
            {data.map((item, index) => {
              const barHeight = item.value > 0 ? Math.max((item.value / max) * height, 3) : 0;
              const dimmed = hasSelection && index !== selectedIndex;
              return (
                <Pressable
                  key={item.key}
                  style={styles.slot}
                  onPress={() => onSelect?.(index === selectedIndex ? null : index)}
                  hitSlop={{top: 8, bottom: 8}}
                  accessibilityRole="button"
                  accessibilityLabel={`${labelFor(item.key)}: ${item.value}`}>
                  <View
                    style={[
                      styles.bar,
                      data.length > 12 && styles.barThin,
                      dimmed && styles.barDimmed,
                      {height: barHeight, backgroundColor: color},
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {/* Labels are centred on their bar but may be wider than it (31 bars). */}
      <View style={styles.labels}>
        {data.map((item, index) =>
          showLabel(index) ? (
            <View
              key={item.key}
              style={[styles.label, {left: `${((index + 0.5) / data.length) * 100}%`}]}>
              <TextComponent
                text={labelFor(item.key)}
                size={10}
                color={index === selectedIndex ? appColors.text : appColors.textMuted}
                numberOfLines={1}
                styles={styles.labelText}
              />
            </View>
          ) : null,
        )}
      </View>
    </View>
  );
};

export default BarChart;

const AXIS_WIDTH = 34;
const LABEL_WIDTH = 32;

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
  },
  axis: {
    width: AXIS_WIDTH,
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: -6,
  },
  area: {
    flex: 1,
  },
  gridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appColors.border,
  },
  bars: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '70%',
    maxWidth: 22,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barThin: {
    maxWidth: 8,
  },
  barDimmed: {
    opacity: 0.3,
  },
  labels: {
    marginLeft: AXIS_WIDTH,
    marginTop: spacing.xs,
    height: 16,
  },
  label: {
    position: 'absolute',
    width: LABEL_WIDTH,
    marginLeft: -LABEL_WIDTH / 2,
  },
  labelText: {
    textAlign: 'center',
  },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
