
/** @light styles - base style **/
const light = {
  default: {
    backgroundColor: lightColor('grey:900'),
  },
  pressed: {
    backgroundColor: lightColor('grey:800'),
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: lightColor('base'),
    alignSelf: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  image: {
    marginLeft: space('xs2'),
  },
};
/** @dark styles - override what’s needed only **/
const dark = {
  text: {
    color: darkColor('grey:100'),
    alignSelf: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  default: {
    backgroundColor: darkColor('white'),
  },
  pressed: {
    backgroundColor: darkColor('grey:800'),
  },
};
export const lightStyles = createStyleSheet(light);
export const darkStyles = createStyleSheet(light, dark);
