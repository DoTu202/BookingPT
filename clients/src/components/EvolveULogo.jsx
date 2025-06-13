// components/EvolveULogo.jsx

import React from 'react';
import Svg, { Path } from 'react-native-svg';

const EvolveULogo = (props) => {
  // Bạn có thể truyền props như width, height, color vào đây
  const { width = 48, height = 48, color = '#f97316' } = props;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M20.954 15.0001C21.3533 13.7845 21.4999 12.4939 21.3753 11.231C21.2507 9.96803 20.858 8.76113 20.2247 7.70293C19.5913 6.64472 18.7345 5.76686 17.7267 5.14853C16.7188 4.5302 15.5894 4.19154 14.437 4.16113"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M3.0459 9C2.64674 10.2155 2.50012 11.5061 2.62473 12.769C2.74934 14.032 3.14197 15.2389 3.77533 16.2971C4.40868 17.3553 5.26553 18.2331 6.27334 18.8515C7.28115 19.4698 8.4106 19.8085 9.56299 19.8389"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M9 7V13C9 14.6569 10.3431 16 12 16C13.6569 16 15 14.6569 15 13V7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EvolveULogo;