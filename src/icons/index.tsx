/* AUTO-GENERATED FILE. DO NOT EDIT. */
import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string; title?: string };

import GoogleSvg from './google.svg';
import KakaoSvg from './kakao.svg';
import NaverSvg from './naver.svg';
import SearchSvg from './search.svg';



export const IconGoogle: React.FC<IconProps> = ({ size = 20, title, ...rest }) => {
  return <GoogleSvg width={size} height={size} aria-hidden={title ? undefined : true} title={title} {...rest} />;
};


export const IconKakao: React.FC<IconProps> = ({ size = 20, title, ...rest }) => {
  return <KakaoSvg width={size} height={size} aria-hidden={title ? undefined : true} title={title} {...rest} />;
};


export const IconNaver: React.FC<IconProps> = ({ size = 20, title, ...rest }) => {
  return <NaverSvg width={size} height={size} aria-hidden={title ? undefined : true} title={title} {...rest} />;
};


export const IconSearch: React.FC<IconProps> = ({ size = 20, title, ...rest }) => {
  return <SearchSvg width={size} height={size} aria-hidden={title ? undefined : true} title={title} {...rest} />;
};
