import React from 'react';
import {StyleSheet, Text} from 'react-native';
import TestRenderer, {act} from 'react-test-renderer';
import AsyncView from '../src/components/feedback/AsyncView';
import Banner from '../src/components/ui/Banner';
import Card from '../src/components/ui/Card';
import ListItem from '../src/components/ui/ListItem';
import ProgressBar from '../src/components/ui/ProgressBar';
import StatGroup from '../src/components/ui/StatGroup';
import Tag from '../src/components/ui/Tag';

const render = element => {
  let renderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
};

const texts = renderer => renderer.root.findAllByType(Text).map(node => [].concat(node.props.children).join(''));

describe('shared components', () => {
  it('Card renders its header and children', () => {
    const tree = render(
      <Card title="Lịch hôm nay" subtitle="3 buổi">
        <Text>body</Text>
      </Card>,
    );
    expect(texts(tree)).toEqual(['Lịch hôm nay', '3 buổi', 'body']);
  });

  it('Banner renders nothing without a message', () => {
    expect(render(<Banner message="" />).toJSON()).toBeNull();
    expect(texts(render(<Banner title="Lý do" message="Bận việc" />))).toEqual(['Lý do', 'Bận việc']);
  });

  it('ProgressBar clamps its value', () => {
    const fillWidth = value => StyleSheet.flatten(render(<ProgressBar value={value} />).toJSON().children[0].props.style).width;
    expect(fillWidth(2)).toBe('100%');
    expect(fillWidth(0.25)).toBe('25%');
    expect(fillWidth(-1)).toBe('0%');
  });

  it('StatGroup shows each value with its label', () => {
    const tree = render(
      <StatGroup
        items={[
          {label: 'Buổi tập', value: 12},
          {label: 'Học viên', value: 3},
        ]}
      />,
    );
    expect(texts(tree)).toEqual(['12', 'Buổi tập', '3', 'Học viên']);
  });

  it('ListItem and Tag render their text', () => {
    expect(texts(render(<ListItem title="An" subtitle="09:00" trailing={<Tag label="Mới" />} />))).toEqual([
      'An',
      '09:00',
      'Mới',
    ]);
  });

  it('AsyncView switches between states', () => {
    expect(texts(render(<AsyncView status="error" error="Lỗi mạng" onRetry={() => {}} />))).toContain('Lỗi mạng');
    expect(texts(render(<AsyncView status="ready">{() => <Text>xong</Text>}</AsyncView>))).toEqual(['xong']);
  });
});
