export interface Spacing {
    none: number;
    tiny: number;
    radius: number;
    smaller: number;
    small: number;
    normal: number;
    large: number;
    medium: number;
    big: number;
    mediumPlush: number;
    huge: number;
    bigger: number;
    massive: number;
    width: number;
    height: number;
}

export interface Colors {
    primary: string;
    secondary: string;

    wildSand: string;
    white: string;
    black: string;
    iceberg: string;
    listItemTapColor: string;
    red2: string;
    lightRed2: string;
    whiteRgba: string
}
export interface FontSize {
    FONT_4: number;

    FONT_5: number;

    FONT_6: number;

    FONT_7: number;

    FONT_8: number;

    FONT_9: number;

    FONT_10: number;

    FONT_11: number;

    FONT_12: number;

    FONT_13: number;

    FONT_14: number;

    FONT_15: number;

    FONT_16: number;

    FONT_17: number;

    FONT_18: number;

    FONT_19: number;

    FONT_20: number;

    FONT_21: number;

    FONT_22: number;

    FONT_23: number;

    FONT_24: number;

    FONT_25: number;

    FONT_26: number;

    FONT_27: number;

    FONT_28: number;

    FONT_29: number;

    FONT_30: number;

    FONT_31: number;

    FONT_32: number;

    FONT_33: number;

    FONT_34: number;

    FONT_35: number;

    FONT_36: number;

    FONT_37: number;

    FONT_44: number;
}

export interface FontFamily {
    PrimaryRegular: string;
    PrimaryBold: string;
    PrimarySemibold: string;
}

export interface Spacing {
    none: number;
    tiny: number;
    smaller: number;
    small: number;
    medium: number;
    mediumPlush: number;
    large: number;
    huge: number;
    massive: number;
}

export interface ThemeColor {
    primary: string;
    semiPrimary: string;
    secondary: string;
    default: string;
    yellow: string;

    // Container
    containerBorder: string;
    containerWithChart: string;

    // Background
    bgPrimary: string;
    bg2: string;
    bg3: string;
    bg4: string;
    bg5: string;
    roundBg: string;
    containerBg: string;
    selectedListBg: string;
    modalOverlayBg: string;
    bgHover: string;
    bgTooltip: string;
    bgFilter: string;

    // Linear blur
    blurFrom: string;
    blurTo: string;

    // Text input
    txtInputPlaceHolder: string;
    txtInputText: string;
    txtInputBorder: string;
    txtAssetInputBorder: string;
    txtInputActive: string;
    txtInputError: string;
    bgInput: string;
    inpBgDefault: string;
    inpBgSecondary: string;
    inpBorderFocus: string;
    inpBorderError: string;
    inpTextError: string;
    inpSecondaryHover: string;

    // Button
    bgBtnPrimary: string;
    txtBtnPrimary: string;
    bgBtnSecondary: string;
    txtBtnSecondary: string;
    btnBuyLight: string;
    btnBuySuccess: string;
    btnBuy: string;
    btnSellLight: string;
    btnSell: string;
    btnDisabled: string;
    btnBgLight: string;

    // Label
    bgLabelActive: string;
    txtLabelActive: string;
    bgLabelInactive: string;
    txtLabelInactive: string;

    // Solid tab bar

    bgTabBar: string;
    txtTabBar: string;
    bgActiveTabBar: string;
    txtActiveTabBar: string;

    // Label tab with indicator
    txtTabActive: string;
    txtTabInactive: string;
    bgTabIndicator: string;

    // Search Box
    bgSearch: string;

    // List
    underlayColor: string;
    listItemSelected: string;

    // Nav bar

    txtActiveNavBar: string;
    bgNavBar: string;
    // Divider
    divider: string;
    divider2: string;
    divider3: string;

    //Text
    primaryText: string;
    primaryText2: string;
    secondaryText: string;
    secondaryText2: string;
    secondaryText3: string;
    secondaryText4: string;
    secondaryTextDisabled: string;

    //icon
    icDefault: string;
    icSecondary: string;
}

export type CommonSizeProps = {
    none: number;
    tiny: number;
    smaller: number;
    small: number;
    normal: number;
    large: number;
    medium: number;
    big: number;
    mediumPlush: number;
    huge: number;
    massive: number;
};

export type DividerSizeProps = {
    thin: number;
    default: number;
    thick: number;
};
