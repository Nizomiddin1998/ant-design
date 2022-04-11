/* eslint-disable no-redeclare */
import { CSSInterpolation, useStyleRegister } from '@ant-design/cssinjs';
import { useContext } from 'react';
import { GlobalToken, OverrideToken } from '../interface';
import { mergeToken, statisticToken, UseComponentStyleResult, useToken } from '../index';
import { ConfigContext } from '../../../config-provider';

export type OverrideTokenWithoutDerivative = Omit<OverrideToken, 'derivative'>;
export type OverrideComponent = keyof OverrideTokenWithoutDerivative;
export type GlobalTokenWithComponent<ComponentName extends OverrideComponent> = GlobalToken &
  OverrideToken[ComponentName];
export type StyleInfo = {
  hashId: string;
  prefixCls: string;
  rootPrefixCls: string;
  iconPrefixCls: string;
};
export type TokenWithCommonCls<T> = T & {
  componentCls: string;
  prefixCls: string;
  iconCls: string;
  antCls: string;
};
export type FullToken<ComponentName extends OverrideComponent> = TokenWithCommonCls<
  GlobalTokenWithComponent<ComponentName>
>;

export default function genComponentStyleHook<ComponentName extends OverrideComponent>(
  component: ComponentName,
  styleFn: (token: FullToken<ComponentName>, info: StyleInfo) => CSSInterpolation,
  getDefaultToken?:
    | OverrideTokenWithoutDerivative[ComponentName]
    | ((token: GlobalToken) => OverrideTokenWithoutDerivative[ComponentName]),
) {
  return (prefixCls: string): UseComponentStyleResult => {
    const [theme, token, hashId] = useToken();
    const { getPrefixCls, iconPrefixCls } = useContext(ConfigContext);
    const rootPrefixCls = getPrefixCls();

    return [
      useStyleRegister({ theme, token, hashId, path: [prefixCls] }, () => {
        const { token: proxyToken, flush } = statisticToken(token);

        const defaultComponentToken =
          typeof getDefaultToken === 'function' ? getDefaultToken(token) : getDefaultToken;
        const overrideComponentToken = token[component] as any;

        // Only merge token specified in interface
        const mergedComponentToken = { ...defaultComponentToken } as any;
        if (overrideComponentToken) {
          Object.keys(mergedComponentToken).forEach(key => {
            mergedComponentToken[key] = overrideComponentToken[key] ?? mergedComponentToken[key];
          });
        }
        const mergedToken = mergeToken<
          TokenWithCommonCls<GlobalTokenWithComponent<OverrideComponent>>
        >(
          proxyToken,
          {
            componentCls: `.${prefixCls}`,
            prefixCls,
            iconCls: `.${iconPrefixCls}`,
            antCls: `.${rootPrefixCls}`,
          },
          mergedComponentToken,
        );

        const styleInterpolation = styleFn(mergedToken as unknown as FullToken<ComponentName>, {
          hashId,
          prefixCls,
          rootPrefixCls,
          iconPrefixCls,
        });
        flush(component);
        return styleInterpolation;
      }),
      hashId,
    ];
  };
}
