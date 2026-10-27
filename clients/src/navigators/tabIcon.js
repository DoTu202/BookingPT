import React from 'react';

// Builds a `tabBarIcon` option from an iconsax icon (filled when focused).
// Defined outside the navigators so React doesn't see a new component type
// on every render.
export const tabIcon = Icon => {
  const TabIcon = ({focused, color, size}) => (
    <Icon size={size} color={color} variant={focused ? 'Bold' : 'Linear'} />
  );
  return TabIcon;
};
